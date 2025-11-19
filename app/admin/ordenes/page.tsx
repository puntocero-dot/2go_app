import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { AdminOrdersTable } from "@/components/admin-orders-table";
import type { Prisma, EstadoOrden } from "@prisma/client";

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

export default async function OrdenesPage({ searchParams }: PageProps) {
  const session = await getSession();
  const currentSearchParams = await searchParams;
  const showCreatedMessage = currentSearchParams?.created === "1";

  const proyectoIdFilter =
    typeof currentSearchParams?.proyectoId === "string" && currentSearchParams.proyectoId !== ""
      ? currentSearchParams.proyectoId
      : "ALL";
  const estadoFilter =
    typeof currentSearchParams?.estado === "string" && currentSearchParams.estado !== ""
      ? currentSearchParams.estado
      : "ALL";
  const fechaInicioFilter =
    typeof currentSearchParams?.fechaInicio === "string"
      ? currentSearchParams.fechaInicio
      : "";
  const fechaFinFilter =
    typeof currentSearchParams?.fechaFin === "string" ? currentSearchParams.fechaFin : "";
  const verCanceladas = currentSearchParams?.verCanceladas === "1";

  if (!session || !["ADMIN", "SUPERVISOR"].includes(session.rol)) {
    redirect("/login");
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.userId },
  });

  if (!usuario) {
    redirect("/login");
  }

  const where: Prisma.OrdenFindManyArgs = { where: {} };

  if (proyectoIdFilter !== "ALL") {
    where.where = where.where ?? {};
    where.where.proyectoId = proyectoIdFilter;
  }
  if (verCanceladas) {
    where.where = where.where ?? {};
    where.where.estado = "CANCELADA" as EstadoOrden;
  } else if (estadoFilter !== "ALL") {
    where.where = where.where ?? {};
    where.where.estado = estadoFilter as EstadoOrden;
  }
  if (fechaInicioFilter || fechaFinFilter) {
    const rango: { gte?: Date; lte?: Date } = {};
    if (fechaInicioFilter) {
      rango.gte = new Date(`${fechaInicioFilter}T00:00:00.000Z`);
    }
    if (fechaFinFilter) {
      rango.lte = new Date(`${fechaFinFilter}T23:59:59.999Z`);
    }
    where.where = where.where ?? {};
    where.where.fechaCreacion = rango;
  }

  const [proyectos, ordenes] = await Promise.all([
    prisma.proyecto.findMany({
      orderBy: { nombreComercial: "asc" },
      select: {
        id: true,
        nombreComercial: true,
      },
    }),
    prisma.orden.findMany({
      ...where,
      orderBy: { fechaCreacion: "desc" },
      include: {
        mueble: true,
        usuarioFinal: true,
        armador: {
          include: {
            usuario: {
              select: {
                nombre: true,
              },
            },
          },
        },
        proyecto: {
          select: {
            nombreComercial: true,
          },
        },
      },
      take: 100,
    }),
  ]);

  const ordenesVisibles = verCanceladas
    ? ordenes
    : ordenes.filter((o) => o.estado !== "CANCELADA");

  // Estadísticas rápidas (excluyendo CANCELADA)
  const stats = {
    sinAsignar: ordenesVisibles.filter((o) => o.estado === "SIN_ASIGNAR").length,
    enProceso: ordenesVisibles.filter((o) =>
      ["ASIGNADO", "EN_RUTA", "ARMADO_INICIADO"].includes(o.estado)
    ).length,
    completadas: ordenesVisibles.filter((o) => o.estado === "ARMADO_COMPLETADO").length,
  };

  const totalFacturado = ordenesVisibles.reduce(
    (acc, orden) => acc + (orden.cobroFinal ?? 0),
    0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={usuario} />

      <main className="container mx-auto px-4 py-8">
        {showCreatedMessage && (
          <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Orden creada correctamente</h2>
                <p className="text-sm text-emerald-800">
                  La orden se registró y aparecerá en la tabla de abajo. Puedes continuar creando más órdenes o quedarte en este listado.
                </p>
              </div>
              <Link
                href="/admin/ordenes"
                className="text-sm font-medium text-emerald-900 underline hover:text-emerald-700"
              >
                Entendido
              </Link>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-deep-navy">
              Gestión de Órdenes
            </h1>
            <p className="text-gray-600 mt-2">
              Administra las órdenes de armado de muebles
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={verCanceladas ? "/admin/ordenes" : "/admin/ordenes?verCanceladas=1"}
            >
              <Button variant="outline">
                {verCanceladas ? "Ver activas" : "Ver canceladas"}
              </Button>
            </Link>
            <Link href="/admin/ordenes/carga-masiva">
              <Button variant="outline">Carga masiva</Button>
            </Link>
            <Link href="/admin/ordenes/nueva">
              <Button className="bg-vibrant-cyan hover:bg-vibrant-cyan/90">
                + Nueva Orden
              </Button>
            </Link>
          </div>
        </div>

        <Card className="mb-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-700">
              Filtros de búsqueda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
              <div className="space-y-1">
                <label htmlFor="proyectoId">Proyecto</label>
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
                <label htmlFor="estado">Estado</label>
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
                <label htmlFor="fechaInicio">Fecha desde</label>
                <input
                  type="date"
                  id="fechaInicio"
                  name="fechaInicio"
                  defaultValue={fechaInicioFilter}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-vibrant-cyan focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="fechaFin">Fecha hasta</label>
                <input
                  type="date"
                  id="fechaFin"
                  name="fechaFin"
                  defaultValue={fechaFinFilter}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-vibrant-cyan focus:outline-none"
                />
              </div>

              <div className="space-y-2 md:col-span-full flex flex-wrap gap-3 pt-1">
                <Button type="submit" className="bg-vibrant-cyan hover:bg-vibrant-cyan/90">
                  Aplicar filtros
                </Button>
                <Link
                  href="/admin/ordenes"
                  className="inline-flex items-center"
                  prefetch={false}
                >
                  <Button type="button" variant="outline">
                    Limpiar
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Estadísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Sin Asignar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">
                {stats.sinAsignar}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                En Proceso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-vibrant-cyan">
                {stats.enProceso}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Completadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-green">
                {stats.completadas}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total facturado (vista)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-deep-navy">
                {formatCurrency(totalFacturado)}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Suma de las órdenes listadas (hasta 100 resultados)
              </p>
            </CardContent>
          </Card>
        </div>

        <section className="space-y-8">
          <AdminOrdersTable
            ordenes={ordenesVisibles.map((orden) => ({
              id: orden.id,
              codigoReferenciaRetail: orden.codigoReferenciaRetail,
              proyectoNombre: orden.proyecto.nombreComercial,
              muebleNombre: orden.mueble.nombre,
              clienteNombre: orden.usuarioFinal.nombre,
              clienteMunicipio: orden.usuarioFinal.municipio,
              armadorNombre: orden.armador?.usuario.nombre ?? null,
              estado: orden.estado,
              fechaCreacion: orden.fechaCreacion.toISOString(),
            }))}
          />
        </section>
      </main>
    </div>
  );
}