import { redirect } from "next/navigation";
import Link from "next/link";

import { Navbar } from "@/components/navbar";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
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
import {
  DollarSign,
  FileText,
  Calendar,
  Filter,
  Download,
  Mail,
  TrendingUp,
  Package,
  MapPin,
  AlertTriangle,
  Clock,
  X,
} from "lucide-react";

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
    }
  }

  return summary;
}

function BillingCard({ 
  title, 
  amount, 
  description, 
  icon: Icon, 
  color = "primary",
  trend
}: {
  title: string;
  amount: number;
  description: string;
  icon: any;
  color?: "primary" | "secondary" | "success" | "warning" | "info";
  trend?: number;
}) {
  const colorClasses = {
    primary: "text-madera-natural bg-madera-natural/10",
    secondary: "text-terracota bg-terracota/10",
    success: "text-green-600 bg-green-100",
    warning: "text-yellow-600 bg-yellow-100",
    info: "text-blue-600 bg-blue-100",
  };

  return (
    <EnhancedCard hover className="relative overflow-hidden p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="absolute top-0 right-0 -mt-4 -mr-4 opacity-10">
        <Icon className="w-20 h-20" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          {trend !== undefined && (
            <div className={`flex items-center text-sm ${
              trend > 0 ? "text-green-600" : "text-red-600"
            }`}>
              <TrendingUp className={`w-4 h-4 mr-1 ${trend < 0 ? "rotate-180" : ""}`} />
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-1">
          {formatCurrency(amount)}
        </h3>
        <p className="text-sm text-muted-foreground font-medium">
          {title}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {description}
        </p>
      </div>
    </EnhancedCard>
  );
}

export default async function FacturacionPage({ searchParams }: PageProps) {
  try {
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

    // Parse filters
    const filters = billingFiltersSchema.parse(currentSearchParams);
    const { start: startDate, end: endDate } = getDateRangeFromFilters(filters);

    // Get proyectos activos
    const proyectos = await prisma.proyecto.findMany({
      where: { activo: true },
      select: { id: true, nombreComercial: true },
      orderBy: { nombreComercial: 'asc' }
    });

    // Get billing data
    const billingData = await getBillingDataset({
      proyectoId: filters.proyectoId === "ALL" ? "ALL" : filters.proyectoId!,
      desde: filters.desde || startDate.toISOString().split('T')[0],
      hasta: filters.hasta || endDate.toISOString().split('T')[0],
    });

    const hasData = billingData && billingData.ordenes.length > 0;
    const summary = billingData ? billingData.totalsByConcept : {
      armado: 0,
      tamano: 0,
      distancia: 0,
      penalizacion: 0,
      prioridad: 0,
      totalFacturado: 0
    };
    const totalAmount = billingData ? billingData.totalsByConcept.totalFacturado : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <Navbar user={usuario} />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gradient mb-2">
                Facturación
              </h1>
              <p className="text-muted-foreground text-lg">
                Gestiona y analiza la facturación de proyectos y conceptos.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {hasData && (
                <BillingEmailButton
                  proyectoId={filters.proyectoId || "ALL"}
                  desde={filters.desde || startDate.toISOString().split('T')[0]}
                  hasta={filters.hasta || endDate.toISOString().split('T')[0]}
                  disabled={!hasData}
                />
              )}
            </div>
          </div>
        </div>

        {/* Filtros */}
        <EnhancedCard hover className="mb-8 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center mb-6">
            <Filter className="w-5 h-5 mr-2 text-primary" />
            <h3 className="text-lg font-semibold">Filtros de facturación</h3>
          </div>
          <form className="grid gap-6 md:grid-cols-[repeat(auto-fit,minmax(250px,1fr))]" method="get">
            <div>
              <Label htmlFor="proyectoId" className="text-sm font-medium">Proyecto</Label>
              <select
                id="proyectoId"
                name="proyectoId"
                defaultValue={filters.proyectoId}
                className="w-full mt-1 rounded-lg border border-input bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              >
                <option value="ALL">Todos los proyectos</option>
                {proyectos.map((proyecto) => (
                  <option key={proyecto.id} value={proyecto.id}>
                    {proyecto.nombreComercial}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="desde" className="text-sm font-medium">
                <Calendar className="w-4 h-4 inline mr-1" />
                Fecha inicio
              </Label>
              <input
                type="date"
                id="desde"
                name="desde"
                defaultValue={filters.desde}
                className="w-full mt-1 rounded-lg border border-input bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>

            <div>
              <Label htmlFor="hasta" className="text-sm font-medium">
                <Calendar className="w-4 h-4 inline mr-1" />
                Fecha fin
              </Label>
              <input
                type="date"
                id="hasta"
                name="hasta"
                defaultValue={filters.hasta}
                className="w-full mt-1 rounded-lg border border-input bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>

            <div className="md:col-span-full flex items-center flex-wrap gap-3 pt-2">
              <EnhancedButton 
                type="submit" 
                variant="default"
                className="min-w-[140px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Aplicar filtros
              </EnhancedButton>
              <Link href="/admin/facturacion" prefetch={false}>
                <EnhancedButton 
                  type="button"
                  variant="outline"
                  className="min-w-[100px]"
                >
                  <X className="w-4 h-4 mr-2" />
                  Limpiar
                </EnhancedButton>
              </Link>
            </div>
          </form>
        </EnhancedCard>

        {hasData ? (
          <>
            {/* Resumen de facturación */}
            <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-8">
              <BillingCard
                title="Total Facturado"
                amount={totalAmount}
                description="Suma de todos los conceptos"
                icon={DollarSign}
                color="primary"
              />
              <BillingCard
                title="Armado"
                amount={summary.armado}
                description="Costos de armado"
                icon={Package}
                color="secondary"
              />
              <BillingCard
                title="Tamaño"
                amount={summary.tamano}
                description="Costos por tamaño"
                icon={Package}
                color="info"
              />
              <BillingCard
                title="Distancia"
                amount={summary.distancia}
                description="Costos de distancia"
                icon={MapPin}
                color="warning"
              />
              <BillingCard
                title="Penalización"
                amount={summary.penalizacion}
                description="Costos por penalización"
                icon={AlertTriangle}
                color="warning"
              />
              <BillingCard
                title="Prioridad"
                amount={summary.prioridad}
                description="Costos por prioridad"
                icon={Clock}
                color="info"
              />
            </section>

            {/* Tabla de facturación */}
            <section className="fade-in-up">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-foreground flex items-center">
                  <FileText className="w-6 h-6 mr-2 text-primary" />
                  Detalle de Facturación
                  <span className="ml-3 text-sm text-muted-foreground">
                    ({billingData?.ordenes?.length || 0} registros)
                  </span>
                </h2>
                <div className="flex items-center space-x-2">
                  <EnhancedButton variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </EnhancedButton>
                </div>
              </div>

              <EnhancedCard hover>
                <div className="rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Orden</TableHead>
                        <TableHead className="font-semibold">Proyecto</TableHead>
                        <TableHead className="font-semibold">Cliente</TableHead>
                        <TableHead className="font-semibold">Conceptos</TableHead>
                        <TableHead className="font-semibold text-right">Total</TableHead>
                        <TableHead className="font-semibold text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {billingData?.ordenes?.map((item: any, index: number) => (
                        <TableRow 
                          key={item.id}
                          className="hover:bg-muted/30 transition-colors cursor-pointer"
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <FileText className="w-4 h-4 mr-2 text-muted-foreground" />
                              {item.codigoReferencia}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Package className="w-4 h-4 mr-2 text-muted-foreground" />
                              {item.proyectoNombre}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <span className="text-muted-foreground">
                                {item.clienteNombre}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {item.conceptos.map((concepto: any, i: number) => (
                                <div key={i} className="text-sm">
                                  <span className="text-muted-foreground">
                                    {concepto.tipo}:
                                  </span>{" "}
                                  <span className="font-medium">
                                    {formatCurrency(concepto.monto)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(item.total)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <EnhancedButton
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <FileText className="w-4 h-4" />
                              </EnhancedButton>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </EnhancedCard>
            </section>
          </>
        ) : (
          <EmptyState 
            icon={<FileText className="w-12 h-12 text-muted-foreground" />}
            title="No hay datos de facturación"
            description="No se encontraron registros para los filtros seleccionados. Intenta ajustar los filtros o el rango de fechas."
            action={{
              label: "Limpiar filtros",
              href: "/admin/facturacion"
            }}
          />
        )}
      </main>
    </div>
  );
  } catch (error) {
    console.error("Error en Facturación:", error);
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <div className="text-center p-8">
          <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error en Facturación</h1>
          <p className="text-gray-600 mb-4">Ha ocurrido un error al cargar los datos de facturación.</p>
          <p className="text-sm text-gray-500 mb-6">
            {error instanceof Error ? error.message : "Error desconocido"}
          </p>
          <Link href="/admin">
            <EnhancedButton>
              Volver al Dashboard
            </EnhancedButton>
          </Link>
        </div>
      </div>
    );
  }
}
