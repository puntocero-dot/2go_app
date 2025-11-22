import { redirect } from "next/navigation";
import Link from "next/link";

import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BillingEmailButton } from "@/components/billing-email-button";
import { formatCurrency } from "@/lib/utils";
import type { BillingConcept } from "@/lib/facturacion-helpers";
import { getBillingDataset } from "@/lib/facturacion-data";
import {
  billingFiltersSchema,
  getDateRangeFromFilters,
} from "@/lib/schemas/facturacion.schema";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

type ConceptSummary = {
  armado: number;
  tamano: number;
  distancia: number;
  penalizacion: number;
  prioridad: number;
};

function summarizeConceptos(conceptos: BillingConcept[]): ConceptSummary {
  const summary: ConceptSummary = {
    armado: 0,
    tamano: 0,
    distancia: 0,
    penalizacion: 0,
    prioridad: 0,
  };

  for (const concepto of conceptos) {
    switch (concepto.tipo) {
      case "ARMADO":
        summary.armado += concepto.monto;
        break;
      case "TAMANO":
        summary.tamano += concepto.monto;
        break;
      case "DISTANCIA":
        summary.distancia += concepto.monto;
        break;
      case "PENALIZACION":
        summary.penalizacion += concepto.monto;
        break;
      case "PRIORIDAD":
        summary.prioridad += concepto.monto;
        break;
      default:
        break;
    }
  }

  return summary;
}

export default async function FacturacionPage({ searchParams }: PageProps) {
  const session = await getSession();
  const currentSearchParams = await searchParams;

  if (!session || session.rol !== "ADMIN") {
    redirect("/login");
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.userId },
  });

  if (!usuario) {
    redirect("/login");
  }

  const proyectos = await prisma.proyecto.findMany({
    where: {
      activo: true,
    },
    orderBy: { nombreComercial: "asc" },
    select: {
      id: true,
      nombreComercial: true,
    },
  });

  const proyectoIdFilter =
    typeof currentSearchParams?.proyectoId === "string" &&
    currentSearchParams.proyectoId !== ""
      ? currentSearchParams.proyectoId
      : "";
  const desdeFilter =
    typeof currentSearchParams?.desde === "string" ? currentSearchParams.desde : "";
  const hastaFilter =
    typeof currentSearchParams?.hasta === "string" ? currentSearchParams.hasta : "";

  const hasDateParams = Boolean(desdeFilter && hastaFilter);
  let range: { start: Date; end: Date } | null = null;
  let hasInvalidRange = false;

  if (proyectoIdFilter && hasDateParams) {
    const parsedFilters = billingFiltersSchema.safeParse({
      proyectoId: proyectoIdFilter,
      desde: desdeFilter,
      hasta: hastaFilter,
    });

    if (parsedFilters.success) {
      range = getDateRangeFromFilters(parsedFilters.data);
    } else {
      hasInvalidRange = true;
    }
  }

  type OrdenPreview = {
    id: string;
    codigoReferenciaRetail: string;
    fechaCompletado: Date | null;
    estado: string;
    montoCalculado: number;
    conceptos: BillingConcept[];
    usuarioFinal: {
      nombre: string;
      municipio: string;
    };
    proyecto: {
      nombreComercial: string;
    };
  };

  let ordenes: OrdenPreview[] = [];

  if (proyectoIdFilter && range) {
    const dataset = await getBillingDataset({
      proyectoId: proyectoIdFilter,
      desde: desdeFilter,
      hasta: hastaFilter,
    });

    if (dataset) {
      ordenes = dataset.ordenes.map((orden): OrdenPreview => {
        return {
          id: orden.id,
          codigoReferenciaRetail: orden.codigoReferenciaRetail,
          fechaCompletado: orden.fechaCompletado,
          estado: orden.estado,
          montoCalculado: orden.total,
          conceptos: orden.conceptos,
          usuarioFinal: {
            nombre: orden.clienteNombre,
            municipio: orden.municipio,
          },
          proyecto: {
            nombreComercial: dataset.proyecto.nombreComercial,
          },
        };
      });
    }
  }

  const pageSize = 50;
  const currentPageParam =
    typeof currentSearchParams?.page === "string"
      ? parseInt(currentSearchParams.page, 10)
      : 1;
  const currentPage =
    Number.isNaN(currentPageParam) || currentPageParam < 1 ? 1 : currentPageParam;

  const totalOrdenes = ordenes.length;
  const totalPages = totalOrdenes > 0 ? Math.ceil(totalOrdenes / pageSize) : 1;
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = totalOrdenes === 0 ? 0 : (safePage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  const paginatedOrdenes =
    totalOrdenes > 0 ? ordenes.slice(startIndex, Math.min(endIndex, totalOrdenes)) : [];

  const totalFacturado = ordenes.reduce(
    (acc, orden) => acc + (orden.montoCalculado ?? 0),
    0,
  );

  const totalsByConcept: ConceptSummary = ordenes.reduce(
    (acc, orden) => {
      const resumen = summarizeConceptos(orden.conceptos);
      acc.armado += resumen.armado;
      acc.tamano += resumen.tamano;
      acc.distancia += resumen.distancia;
      acc.penalizacion += resumen.penalizacion;
      acc.prioridad += resumen.prioridad;
      return acc;
    },
    { armado: 0, tamano: 0, distancia: 0, penalizacion: 0, prioridad: 0 },
  );

  const periodoLabel = range
    ? `${range.start.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })} - ${range.end.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })}`
    : "Sin periodo seleccionado";

  const hasFiltersApplied = Boolean(proyectoIdFilter && hasDateParams && range);
  const canExport = hasFiltersApplied && ordenes.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={usuario} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Facturación</h1>
          <p className="mt-2 text-muted-foreground">
            Revisa la facturación por proyecto basada en órdenes completadas en el periodo seleccionado.
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-muted-foreground">
              Filtros de facturación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 md:grid-cols-[repeat(auto-fit,minmax(220px,1fr))]"
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
                  <option value="">Selecciona un proyecto</option>
                  {proyectos.map((proyecto: { id: string; nombreComercial: string }) => (
                    <option key={proyecto.id} value={proyecto.id}>
                      {proyecto.nombreComercial}
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

              <div className="md:col-span-full flex flex-wrap items-center gap-3 pt-1">
                <Button
                  type="submit"
                  className="bg-vibrant-cyan hover:bg-vibrant-cyan/90"
                >
                  Aplicar filtros
                </Button>
                <Link
                  href="/admin/facturacion"
                  className="inline-flex items-center"
                  prefetch={false}
                >
                  <Button type="button" variant="outline">
                    Limpiar
                  </Button>
                </Link>
              </div>
            </form>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">Acciones sobre el periodo filtrado</p>
              <div className="flex flex-wrap gap-2">
                {canExport ? (
                  <Link
                    href={`/api/facturacion/export?proyectoId=${proyectoIdFilter}&desde=${desdeFilter}&hasta=${hastaFilter}`}
                    prefetch={false}
                  >
                    <Button variant="outline" size="sm" type="button">
                      Exportar CSV
                    </Button>
                  </Link>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    disabled
                  >
                    Exportar CSV
                  </Button>
                )}

                {hasFiltersApplied && ordenes.length > 0 ? (
                  <Link
                    href={`/api/facturacion/pdf?proyectoId=${proyectoIdFilter}&desde=${desdeFilter}&hasta=${hastaFilter}`}
                    prefetch={false}
                    target="_blank"
                  >
                    <Button variant="outline" size="sm" type="button">
                      Vista previa PDF
                    </Button>
                  </Link>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    disabled
                  >
                    Vista previa PDF
                  </Button>
                )}

                <BillingEmailButton
                  proyectoId={proyectoIdFilter}
                  desde={desdeFilter}
                  hasta={hastaFilter}
                  disabled={!hasFiltersApplied || !ordenes.length}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <section className="grid gap-6 md:grid-cols-3 mb-10">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Órdenes completadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-electric-coral">{totalOrdenes}</p>
              <p className="text-sm text-gray-500">En el periodo seleccionado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total facturado (órdenes)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-foreground">
                {formatCurrency(totalFacturado)}
              </p>
              <p className="text-xs text-muted-foreground">
                Suma del monto calculado según las reglas de facturación
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Periodo seleccionado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-semibold text-foreground">{periodoLabel}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Define el rango de fechas que se incluye en la facturación
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">
              Preview de órdenes facturables
            </h2>
          </div>

          {hasInvalidRange && (
            <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-6 text-sm text-amber-800">
              El rango de fechas seleccionado es inválido. Verifica que la fecha "Desde" no sea posterior a la fecha "Hasta".
            </div>
          )}

          {!hasInvalidRange && !hasFiltersApplied && (
            <div className="rounded-md border border-dashed border-border bg-card px-4 py-6 text-sm text-muted-foreground">
              Selecciona un proyecto y un rango de fechas y aplica los filtros para ver el detalle de órdenes facturables.
            </div>
          )}

          {!hasInvalidRange && hasFiltersApplied && !ordenes.length && (
            <div className="rounded-md border border-border bg-card px-4 py-6 text-sm text-muted-foreground">
              No se encontraron órdenes completadas para este proyecto en el periodo seleccionado.
            </div>
          )}

          {!hasInvalidRange && hasFiltersApplied && ordenes.length > 0 && (
            <div className="rounded-md border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Orden</TableHead>
                    <TableHead>Proyecto</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Municipio</TableHead>
                    <TableHead>Fecha armado</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Armado</TableHead>
                    <TableHead className="text-right">Tamaño</TableHead>
                    <TableHead className="text-right">Distancia</TableHead>
                    <TableHead className="text-right">Penalización</TableHead>
                    <TableHead className="text-right">Prioridad</TableHead>
                    <TableHead className="text-right">Monto total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedOrdenes.map((orden: OrdenPreview) => {
                    const resumen = summarizeConceptos(orden.conceptos);
                    return (
                      <TableRow key={orden.id}>
                        <TableCell className="font-medium">
                          {orden.codigoReferenciaRetail}
                        </TableCell>
                        <TableCell>{orden.proyecto.nombreComercial}</TableCell>
                        <TableCell>{orden.usuarioFinal.nombre}</TableCell>
                        <TableCell>{orden.usuarioFinal.municipio}</TableCell>
                        <TableCell>
                          {orden.fechaCompletado
                            ? orden.fechaCompletado.toLocaleDateString("es-ES", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "Sin fecha"}
                        </TableCell>
                        <TableCell>{orden.estado.replace(/_/g, " ")}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(resumen.armado)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(resumen.tamano)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(resumen.distancia)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(resumen.penalizacion)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(resumen.prioridad)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(orden.montoCalculado ?? 0)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="flex justify-end border-t border-border px-4 py-3 text-sm text-foreground">
                <div className="space-y-1 text-right">
                  <p className="font-semibold">
                    Total cobro por armado: {formatCurrency(totalsByConcept.armado)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tamaño {formatCurrency(totalsByConcept.tamano)} • Distancia {""}
                    {formatCurrency(totalsByConcept.distancia)} • Penalización {""}
                    {formatCurrency(totalsByConcept.penalizacion)} • Prioridad {""}
                    {formatCurrency(totalsByConcept.prioridad)}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between px-4 py-2 text-xs text-muted-foreground">
                <span>
                  Mostrando {startIndex + 1}–
                  {Math.min(endIndex, totalOrdenes)} de {totalOrdenes} órdenes
                </span>
                {totalPages > 1 && (
                  <div className="inline-flex items-center gap-2">
                    <Link
                      href={`/admin/facturacion?proyectoId=${proyectoIdFilter}&desde=${desdeFilter}&hasta=${hastaFilter}&page=${Math.max(
                        1,
                        currentPage - 1,
                      )}`}
                      prefetch={false}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        disabled={currentPage <= 1}
                      >
                        Anterior
                      </Button>
                    </Link>
                    <span>
                      Página {currentPage} de {totalPages}
                    </span>
                    <Link
                      href={`/admin/facturacion?proyectoId=${proyectoIdFilter}&desde=${desdeFilter}&hasta=${hastaFilter}&page=${Math.min(
                        totalPages,
                        currentPage + 1,
                      )}`}
                      prefetch={false}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        disabled={currentPage >= totalPages}
                      >
                        Siguiente
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
