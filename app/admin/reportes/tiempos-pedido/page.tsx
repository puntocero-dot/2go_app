import { redirect } from "next/navigation";
import type { EstadoOrden } from "@prisma/client";

import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const ESTADOS_ORDEN: { value: "" | EstadoOrden; label: string }[] = [
  { value: "", label: "Todos los estados" },
  { value: "SIN_ASIGNAR", label: "Sin asignar" },
  { value: "ASIGNADO", label: "Asignado" },
  { value: "EN_RUTA", label: "En ruta" },
  { value: "ARMADO_INICIADO", label: "Armado iniciado" },
  { value: "ARMADO_FINALIZADO", label: "Armado finalizado" },
  { value: "ARMADO_COMPLETADO", label: "Armado completado" },
  { value: "CANCELADA", label: "Cancelada" },
];

type ReportRow = {
  ordenId: string;
  codigoReferenciaRetail: string;
  proyecto: string;
  armador: string | null;
  estadoActual: EstadoOrden;
  fechaCreacion: Date;
  fechaCompletado: Date | null;
  tiempoTotalSegundos: number;
};

function formatSecondsToLabel(seconds: number): string {
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const parts: string[] = [];

  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(" ");
}

export default async function ReporteTiemposPedidoPage({ searchParams }: PageProps) {
  const session = await getSession();
  const params = await searchParams;

  if (!session || session.rol !== "ADMIN") {
    redirect("/login");
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.userId },
  });

  if (!usuario) {
    redirect("/login");
  }

  const proyectoIdFilter =
    typeof params?.proyectoId === "string" && params.proyectoId !== ""
      ? params.proyectoId
      : "";
  const estadoFilter =
    typeof params?.estado === "string" && params.estado !== ""
      ? (params.estado as EstadoOrden)
      : "";
  const armadorIdFilter =
    typeof params?.armadorId === "string" && params.armadorId !== ""
      ? params.armadorId
      : "";
  const desdeFilter =
    typeof params?.desde === "string" && params.desde !== "" ? params.desde : "";
  const hastaFilter =
    typeof params?.hasta === "string" && params.hasta !== "" ? params.hasta : "";

  const proyectos = await prisma.proyecto.findMany({
    where: { activo: true },
    orderBy: { nombreComercial: "asc" },
    select: {
      id: true,
      nombreComercial: true,
    },
  });

  const armadores = await prisma.armador.findMany({
    include: {
      usuario: {
        select: {
          nombre: true,
        },
      },
    },
    orderBy: {
      usuario: {
        nombre: "asc",
      },
    },
  });

  let hasFiltersApplied = false;
  let hasInvalidRange = false;
  let reportRows: ReportRow[] = [];

  let desdeDate: Date | undefined;
  let hastaDate: Date | undefined;

  if (proyectoIdFilter || estadoFilter || armadorIdFilter || (desdeFilter && hastaFilter)) {
    hasFiltersApplied = true;

    if (desdeFilter) {
      const d = new Date(`${desdeFilter}T00:00:00.000Z`);
      if (Number.isNaN(d.getTime())) {
        hasInvalidRange = true;
      } else {
        desdeDate = d;
      }
    }

    if (hastaFilter) {
      const h = new Date(`${hastaFilter}T23:59:59.999Z`);
      if (Number.isNaN(h.getTime())) {
        hasInvalidRange = true;
      } else {
        hastaDate = h;
      }
    }

    if (!hasInvalidRange) {
      const where: any = {};

      if (proyectoIdFilter) where.proyectoId = proyectoIdFilter;
      if (estadoFilter) where.estado = estadoFilter as EstadoOrden;
      if (armadorIdFilter) where.armadorId = armadorIdFilter;
      if (desdeDate || hastaDate) {
        where.fechaCreacion = {
          ...(desdeDate && { gte: desdeDate }),
          ...(hastaDate && { lte: hastaDate }),
        };
      }

      const ordenes = await prisma.orden.findMany({
        where,
        include: {
          registrosEstado: {
            orderBy: { timestamp: "asc" },
          },
          proyecto: {
            select: { nombreComercial: true },
          },
          armador: {
            include: {
              usuario: {
                select: {
                  nombre: true,
                },
              },
            },
          },
        },
        orderBy: { fechaCreacion: "desc" },
        take: 200,
      });

      for (const orden of ordenes) {
        const registrosOrdenados = [...orden.registrosEstado].sort(
          (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
        );

        let tiempoTotal = 0;

        for (let i = 0; i < registrosOrdenados.length - 1; i++) {
          const registroActual = registrosOrdenados[i];
          const siguienteRegistro = registrosOrdenados[i + 1];

          const duracion =
            (siguienteRegistro.timestamp.getTime() -
              registroActual.timestamp.getTime()) /
            1000;

          if (duracion > 0) {
            tiempoTotal += duracion;
          }
        }

        if (registrosOrdenados.length > 0 && orden.fechaCompletado) {
          const ultimoRegistro = registrosOrdenados[registrosOrdenados.length - 1];
          const duracion =
            (orden.fechaCompletado.getTime() - ultimoRegistro.timestamp.getTime()) /
            1000;

          if (duracion > 0) {
            tiempoTotal += duracion;
          }
        }

        reportRows.push({
          ordenId: orden.id,
          codigoReferenciaRetail: orden.codigoReferenciaRetail,
          proyecto: orden.proyecto.nombreComercial,
          armador: orden.armador?.usuario?.nombre ?? null,
          estadoActual: orden.estado,
          fechaCreacion: orden.fechaCreacion,
          fechaCompletado: orden.fechaCompletado ?? null,
          tiempoTotalSegundos: tiempoTotal,
        });
      }
    }
  }

  const totalOrdenes = reportRows.length;
  const totalSegundos = reportRows.reduce(
    (acc, row) => acc + row.tiempoTotalSegundos,
    0,
  );
  const promedioSegundos = totalOrdenes > 0 ? totalSegundos / totalOrdenes : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={usuario} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-deep-navy">
            Reporte de tiempos por pedido
          </h1>
          <p className="text-gray-600 mt-2">
            Analiza el tiempo total de procesamiento de las órdenes por proyecto, armador y
            estado.
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-700">
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 md:grid-cols-[repeat(auto-fit,minmax(200px,1fr))]"
              method="get"
            >
              <div className="space-y-1">
                <Label htmlFor="proyectoId">Proyecto</Label>
                <select
                  id="proyectoId"
                  name="proyectoId"
                  defaultValue={proyectoIdFilter}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-vibrant-cyan focus:outline-none"
                >
                  <option value="">Todos los proyectos</option>
                  {proyectos.map((proyecto) => (
                    <option key={proyecto.id} value={proyecto.id}>
                      {proyecto.nombreComercial}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="estado">Estado</Label>
                <select
                  id="estado"
                  name="estado"
                  defaultValue={estadoFilter}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm uppercase focus:border-vibrant-cyan focus:outline-none"
                >
                  {ESTADOS_ORDEN.map((estado) => (
                    <option key={estado.value || "ALL"} value={estado.value}>
                      {estado.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="armadorId">Armador</Label>
                <select
                  id="armadorId"
                  name="armadorId"
                  defaultValue={armadorIdFilter}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-vibrant-cyan focus:outline-none"
                >
                  <option value="">Todos los armadores</option>
                  {armadores.map((armador) => (
                    <option key={armador.id} value={armador.id}>
                      {armador.usuario?.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="desde">Desde</Label>
                <input
                  type="date"
                  id="desde"
                  name="desde"
                  defaultValue={desdeFilter}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-vibrant-cyan focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="hasta">Hasta</Label>
                <input
                  type="date"
                  id="hasta"
                  name="hasta"
                  defaultValue={hastaFilter}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-vibrant-cyan focus:outline-none"
                />
              </div>

              <div className="md:col-span-full flex items-center flex-wrap gap-3 pt-1">
                <Button
                  type="submit"
                  size="default"
                  className="bg-vibrant-cyan hover:bg-vibrant-cyan/90"
                >
                  Aplicar filtros
                </Button>
                <a
                  href="/admin/reportes/tiempos-pedido"
                  className="inline-flex items-center"
                >
                  <Button type="button" variant="outline" size="default">
                    Limpiar
                  </Button>
                </a>
              </div>
            </form>

            {hasInvalidRange && (
              <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                El rango de fechas seleccionado es inválido. Verifica que la fecha "Desde" no sea posterior a la fecha "Hasta".
              </div>
            )}
          </CardContent>
        </Card>

        {hasFiltersApplied && !hasInvalidRange && (
          <section className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">
                    Órdenes en el reporte
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-electric-coral">{totalOrdenes}</p>
                  <p className="text-sm text-gray-500">Coinciden con los filtros aplicados</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">
                    Tiempo promedio por pedido
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold text-deep-navy">
                    {formatSecondsToLabel(promedioSegundos)}
                  </p>
                  <p className="text-sm text-gray-500">Desde creación hasta fin de armado</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">
                    Tiempo total acumulado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold text-deep-navy">
                    {formatSecondsToLabel(totalSegundos)}
                  </p>
                  <p className="text-sm text-gray-500">Suma de todos los pedidos del reporte</p>
                </CardContent>
              </Card>
            </div>

            {totalOrdenes === 0 ? (
              <div className="rounded-md border border-dashed border-gray-300 bg-white px-4 py-6 text-sm text-gray-600">
                No se encontraron órdenes con los filtros seleccionados.
              </div>
            ) : (
              <div className="rounded-md border bg-white">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Orden</TableHead>
                      <TableHead>Proyecto</TableHead>
                      <TableHead>Armador</TableHead>
                      <TableHead>Estado actual</TableHead>
                      <TableHead>Fecha creación</TableHead>
                      <TableHead className="text-right">Tiempo total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportRows.map((row) => (
                      <TableRow key={row.ordenId}>
                        <TableCell className="font-medium">
                          {row.codigoReferenciaRetail}
                        </TableCell>
                        <TableCell>{row.proyecto}</TableCell>
                        <TableCell>{row.armador || "No asignado"}</TableCell>
                        <TableCell>{row.estadoActual.replace(/_/g, " ")}</TableCell>
                        <TableCell>
                          {row.fechaCreacion.toLocaleDateString("es-ES", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatSecondsToLabel(row.tiempoTotalSegundos)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>
        )}

        {!hasFiltersApplied && !hasInvalidRange && (
          <div className="rounded-md border border-dashed border-gray-300 bg-white px-4 py-6 text-sm text-gray-600">
            Selecciona al menos un filtro y haz clic en "Aplicar filtros" para ver el reporte de
            tiempos por pedido.
          </div>
        )}
      </main>
    </div>
  );
}
