import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { Badge } from "@/components/ui/badge";
import { EmptyOrders, EmptyState } from "@/components/ui/empty-state";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { AdminOrdersTable } from "@/components/admin-orders-table";
import type { Prisma, EstadoOrden } from "@prisma/client";
import { 
  FileText, 
  Package, 
  Users, 
  DollarSign, 
  CheckCircle, 
  Clock,
  Calendar,
  Filter,
  Plus,
  AlertCircle
} from "lucide-react";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const ESTADOS_ORDEN = [
  { value: "SIN_ASIGNAR", label: "Sin asignar", color: "bg-gray-100 text-gray-800" },
  { value: "ASIGNADO", label: "Asignado", color: "bg-blue-100 text-blue-800" },
  { value: "EN_RUTA", label: "En ruta", color: "bg-yellow-100 text-yellow-800" },
  { value: "ARMADO_INICIADO", label: "Armado iniciado", color: "bg-purple-100 text-purple-800" },
  { value: "ARMADO_FINALIZADO", label: "Armado finalizado", color: "bg-indigo-100 text-indigo-800" },
  { value: "ARMADO_COMPLETADO", label: "Armado completado", color: "bg-green-100 text-green-800" },
];

function StatsCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  color = "primary" 
}: {
  title: string;
  value: string | number;
  description: string;
  icon: any;
  color?: "primary" | "secondary" | "success" | "warning" | "info";
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
        <div className="flex items-center mb-4">
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-1">
          {value}
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

  const ordenWhere: Prisma.OrdenWhereInput = {};
  if (proyectoIdFilter !== "ALL") {
    ordenWhere.proyectoId = proyectoIdFilter;
  }

  const estadoValue: EstadoOrden | null =
    estadoFilter !== "ALL" ? (estadoFilter as EstadoOrden) : null;

  if (estadoValue) {
    ordenWhere.estado = estadoValue;
  } else if (!verCanceladas) {
    ordenWhere.estado = { not: "CANCELADA" };
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

  const [
    proyectos,
    ordenesVisibles,
    stats,
    totalFacturado,
  ] = await Promise.all([
    prisma.proyecto.findMany({
      orderBy: { nombreComercial: "asc" },
      select: { id: true, nombreComercial: true },
    }),
    prisma.orden.findMany({
      where: ordenWhere,
      take: 100,
      orderBy: { fechaCreacion: "desc" },
      include: {
        proyecto: { select: { nombreComercial: true } },
        mueble: { select: { nombre: true } },
        usuarioFinal: { select: { nombre: true, municipio: true } },
        armador: { include: { usuario: { select: { nombre: true } } } },
      },
    }),
    prisma.orden.groupBy({
      by: ["estado"],
      where: ordenWhere,
      _count: { id: true },
    }),
    prisma.orden.aggregate({
      where: ordenWhere,
      _sum: { cobroFinal: true },
    }),
  ]);

  const statsMap = stats.reduce((acc, stat) => {
    acc[stat.estado] = stat._count.id;
    return acc;
  }, {} as Record<string, number>);

  const totalStats = {
    pendientes: statsMap.SIN_ASIGNAR || 0,
    asignadas: statsMap.ASIGNADO || 0,
    enRuta: statsMap.EN_RUTA || 0,
    enProgreso: statsMap.ARMADO_INICIADO || 0,
    completadas: statsMap.ARMADO_COMPLETADO || 0,
  };

  const hasActiveFilters = proyectoIdFilter !== "ALL" || estadoFilter !== "ALL" || fechaInicioFilter || fechaFinFilter;
  const hasOrders = ordenesVisibles.length > 0;

  const getEstadoBadge = (estado: string) => {
    const estadoConfig = ESTADOS_ORDEN.find(e => e.value === estado);
    return estadoConfig?.color || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <Navbar user={usuario} />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gradient mb-2">
                Gestión de Órdenes
              </h1>
              <p className="text-muted-foreground text-lg">
                Administra y monitorea todas las órdenes del sistema.
              </p>
            </div>
            <Link href="/admin/ordenes/crear">
              <EnhancedButton variant="default" className="min-w-[160px] bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Orden
              </EnhancedButton>
            </Link>
          </div>
        </div>

        {/* Success Message */}
        {showCreatedMessage && (
          <EnhancedCard className="mb-6 p-4 border-green-200 bg-green-50 rounded-xl shadow-sm">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
              <div>
                <p className="text-green-800 font-medium">¡Orden creada exitosamente!</p>
                <p className="text-green-600 text-sm">La orden ha sido agregada al sistema.</p>
              </div>
            </div>
          </EnhancedCard>
        )}

        {/* Filtros */}
        <EnhancedCard hover className="mb-8 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center mb-6">
            <Filter className="w-5 h-5 mr-2 text-primary" />
            <h3 className="text-lg font-semibold text-gray-900 tracking-tight">Filtros de búsqueda</h3>
          </div>
          <form className="grid gap-6 md:grid-cols-[repeat(auto-fit,minmax(280px,1fr))] p-6 bg-gray-50 rounded-xl border border-gray-200 shadow-sm" method="get">
            <div className="space-y-2">
              <Label htmlFor="proyectoId" className="text-sm font-medium text-gray-700 tracking-wide">Proyecto</Label>
              <select
                id="proyectoId"
                name="proyectoId"
                defaultValue={proyectoIdFilter}
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

            <div className="space-y-2">
              <Label htmlFor="estado" className="text-sm font-medium text-gray-700 tracking-wide">Estado</Label>
              <select
                id="estado"
                name="estado"
                defaultValue={estadoFilter}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm uppercase focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
              >
                <option value="ALL">Todos los estados</option>
                {ESTADOS_ORDEN.map((estado) => (
                  <option key={estado.value} value={estado.value}>
                    {estado.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fechaInicio" className="text-sm font-medium text-gray-700 tracking-wide">
                <Calendar className="w-4 h-4 inline mr-2" />
                Fecha inicio
              </Label>
              <input
                type="date"
                id="fechaInicio"
                name="fechaInicio"
                defaultValue={fechaInicioFilter}
                className="w-full mt-1 rounded-lg border border-input bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fechaFin" className="text-sm font-medium text-gray-700 tracking-wide">
                <Calendar className="w-4 h-4 inline mr-2" />
                Fecha fin
              </Label>
              <input
                type="date"
                id="fechaFin"
                name="fechaFin"
                defaultValue={fechaFinFilter}
                className="w-full mt-1 rounded-lg border border-input bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>

            <div className="md:col-span-full flex items-center flex-wrap gap-4 pt-6 border-t border-gray-200">
              <EnhancedButton
                type="submit"
                className="min-w-[140px]"
              >
                <Filter className="w-4 h-4 mr-2" />
                Aplicar filtros
              </EnhancedButton>
              <Link href="/admin/ordenes" prefetch={false}>
                <EnhancedButton variant="outline" className="min-w-[100px]">
                  Limpiar
                </EnhancedButton>
              </Link>
            </div>
          </form>
        </EnhancedCard>

        {/* Stats Cards */}
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-8">
          <StatsCard
            title="Pendientes"
            value={totalStats.pendientes}
            description="Sin asignar"
            icon={Clock}
            color="warning"
          />
          <StatsCard
            title="Asignadas"
            value={totalStats.asignadas}
            description="Con armador"
            icon={Users}
            color="info"
          />
          <StatsCard
            title="En Ruta"
            value={totalStats.enRuta}
            description="En transporte"
            icon={Package}
            color="warning"
          />
          <StatsCard
            title="En Progreso"
            value={totalStats.enProgreso}
            description="Armado iniciado"
            icon={AlertCircle}
            color="secondary"
          />
          <StatsCard
            title="Completadas"
            value={totalStats.completadas}
            description="Finalizadas"
            icon={CheckCircle}
            color="success"
          />
          <StatsCard
            title="Total Facturado"
            value={formatCurrency(totalFacturado._sum.cobroFinal ?? 0)}
            description="Suma de órdenes visibles"
            icon={DollarSign}
            color="primary"
          />
        </section>

        {/* Tabla de Órdenes o Empty State */}
        <section className="fade-in-up">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-foreground flex items-center">
              <FileText className="w-6 h-6 mr-2 text-primary" />
              {hasActiveFilters ? "Órdenes Filtradas" : "Todas las Órdenes"}
              {hasOrders && (
                <Badge variant="outline" className="ml-3">
                  {ordenesVisibles.length} resultados
                </Badge>
              )}
            </h2>
            {hasOrders && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  Mostrando últimas 100 órdenes
                </span>
              </div>
            )}
          </div>

          {hasOrders ? (
            <EnhancedCard hover>
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
            </EnhancedCard>
          ) : (
            <EmptyOrders 
              onCreate={() => {
                // Redirigir a crear orden
                window.location.href = "/admin/ordenes/crear";
              }}
            />
          )}
        </section>
      </main>
    </div>
  );
}
