import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma, EstadoOrden } from "@prisma/client";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const ESTADOS_ORDEN = [
  { value: "SIN_ASIGNAR", label: "Sin asignar" },
  { value: "ASIGNADO", label: "Asignado" },
  { value: "EN_RUTA", label: "En ruta" },
  { value: "ARMADO_INICIADO", label: "Armado iniciado" },
  { value: "ARMADO_FINALIZADO", label: "Armado finalizado" },
  { value: "ARMADO_COMPLETADO", label: "Armado completado" },
];

export default async function AdminDashboard({ searchParams }: PageProps) {
  const session = await getSession();
  const filters = await searchParams;

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
    typeof filters?.proyectoId === "string" && filters.proyectoId !== ""
      ? filters.proyectoId
      : "ALL";
  const estadoFilter =
    typeof filters?.estado === "string" && filters.estado !== ""
      ? filters.estado
      : "ALL";
  const fechaInicioFilter =
    typeof filters?.fechaInicio === "string" ? filters.fechaInicio : "";
  const fechaFinFilter =
    typeof filters?.fechaFin === "string" ? filters.fechaFin : "";

  const ordenWhere: Prisma.OrdenWhereInput = {};

  if (proyectoIdFilter !== "ALL") {
    ordenWhere.proyectoId = proyectoIdFilter;
  }
  const estadoValue: EstadoOrden | null =
    estadoFilter !== "ALL" ? (estadoFilter as EstadoOrden) : null;

  if (estadoValue) {
    ordenWhere.estado = estadoValue;
  }
  if (fechaInicioFilter || fechaFinFilter) {
    const rango: { gte?: Date; lte?: Date } = {};
    if (fechaInicioFilter) {
      rango.gte = new Date(`${fechaInicioFilter}T00:00:00.000Z`);
    }
    if (fechaFinFilter) {
      rango.lte = new Date(`${fechaFinFilter}T23:59:59.999Z`);
    }
    ordenWhere.fechaCreacion = rango;
  }

  const activeStatuses = [
    "SIN_ASIGNAR",
    "ASIGNADO",
    "EN_RUTA",
    "ARMADO_INICIADO",
  ] as const;

  const activeStatusList: EstadoOrden[] = activeStatuses.map(
    (status) => status as EstadoOrden
  );

  const activeWhere: Prisma.OrdenWhereInput = !estadoValue
    ? {
        ...ordenWhere,
        estado: {
          in: activeStatusList,
        },
      }
    : activeStatusList.includes(estadoValue)
    ? { ...ordenWhere }
    : {
        ...ordenWhere,
        estado: {
          in: [] as EstadoOrden[],
        },
      };

  const [
    totalProyectosGlobal,
    totalArmadores,
    armadoresActivos,
    proyectos,
    totalOrdenes,
    ordenesActivas,
    ordenesSumatorio,
    ordenesRecientes,
  ] = await Promise.all([
    prisma.proyecto.count(),
    prisma.armador.count(),
    prisma.armador.count({ where: { estado: "ACTIVO" } }),
    prisma.proyecto.findMany({
      orderBy: { nombreComercial: "asc" },
      select: {
        id: true,
        nombreComercial: true,
      },
    }),
    prisma.orden.count({ where: ordenWhere }),
    prisma.orden.count({ where: activeWhere }),
    prisma.orden.aggregate({ where: ordenWhere, _sum: { cobroFinal: true } }),
    prisma.orden.findMany({
      where: ordenWhere,
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        proyecto: { select: { nombreComercial: true } },
        armador: { include: { usuario: true } },
      },
    }),
  ]);

  const totalProyectos =
    proyectoIdFilter === "ALL"
      ? totalProyectosGlobal
      : proyectos.some((proyecto) => proyecto.id === proyectoIdFilter)
      ? 1
      : 0;

  const totalFacturado = ordenesSumatorio._sum.cobroFinal ?? 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={usuario} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-deep-navy">
            Dashboard Admin
          </h1>
          <p className="text-gray-600 mt-2">
            Bienvenido al panel de control. Aquí tienes un resumen de la
            operación.
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-700">
              Filtros de métricas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-[repeat(auto-fit,minmax(200px,1fr))]" method="get">
              <div className="space-y-1">
                <Label htmlFor="proyectoId">Proyecto</Label>
                <select
                  id="proyectoId"
                  name="proyectoId"
                  defaultValue={proyectoIdFilter}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-vibrant-cyan focus:outline-none"
                >
                  <option value="ALL">Todos los proyectos</option>
                  {proyectos.map((proyecto) => (
                    <option key={proyecto.id} value={proyecto.id}>
                      {proyecto.nombreComercial}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="estado">Estado de orden</Label>
                <select
                  id="estado"
                  name="estado"
                  defaultValue={estadoFilter}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm uppercase focus:border-vibrant-cyan focus:outline-none"
                >
                  <option value="ALL">Todos los estados</option>
                  {ESTADOS_ORDEN.map((estado) => (
                    <option key={estado.value} value={estado.value}>
                      {estado.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="fechaInicio">Fecha desde</Label>
                <input
                  type="date"
                  id="fechaInicio"
                  name="fechaInicio"
                  defaultValue={fechaInicioFilter}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-vibrant-cyan focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="fechaFin">Fecha hasta</Label>
                <input
                  type="date"
                  id="fechaFin"
                  name="fechaFin"
                  defaultValue={fechaFinFilter}
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
                <Link href="/admin" className="inline-flex items-center" prefetch={false}>
                  <Button type="button" variant="outline" size="default">
                    Limpiar
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Total de Proyectos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-electric-coral">
                {totalProyectos}
              </p>
              <p className="text-sm text-gray-500">
                Proyectos registrados en el sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Total de Órdenes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-electric-coral">
                {totalOrdenes}
              </p>
              <p className="text-sm text-gray-500">
                Incluye órdenes completadas y en proceso
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Órdenes Activas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-electric-coral">
                  {ordenesActivas}
                </p>
                <Badge variant="outline" className="text-sm">
                  En ejecución
                </Badge>
              </div>
              <p className="text-sm text-gray-500">
                Órdenes pendientes de completar
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Armadores Registrados</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-electric-coral">
                {totalArmadores}
              </p>
              <p className="text-sm text-gray-500">
                Total de armadores en el sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Armadores Activos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-electric-coral">
                {armadoresActivos}
              </p>
              <p className="text-sm text-gray-500">
                Armadores disponibles para asignación
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Total Facturado</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-deep-navy">
                {formatCurrency(totalFacturado)}
              </p>
              <p className="text-sm text-gray-500">
                Basado en órdenes filtradas
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold text-deep-navy mb-4">
            Órdenes Recientes
          </h2>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Orden</TableHead>
                  <TableHead>Proyecto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Armador</TableHead>
                  <TableHead>Creada</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordenesRecientes.map((orden) => (
                  <TableRow key={orden.id}>
                    <TableCell className="font-medium">{orden.codigoReferenciaRetail}</TableCell>
                    <TableCell>
                      {orden.proyecto?.nombreComercial ?? "Proyecto sin asignar"}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-electric-coral/10 text-electric-coral">
                        {orden.estado.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {orden.armador?.usuario?.nombre ?? "No asignado"}
                    </TableCell>
                    <TableCell>
                      {orden.createdAt.toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      </main>
    </div>
  );
}