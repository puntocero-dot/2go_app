import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma, EstadoOrden } from "@prisma/client";
import { getBillingDataset } from "@/lib/facturacion-data";

// Forzar renderizado dinámico para evitar errores con cookies
export const dynamic = 'force-dynamic';
import { Navbar } from "@/components/navbar";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { EnhancedInput } from "@/components/ui/enhanced-input";
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
import { 
  TrendingUp, 
  Package, 
  Users, 
  FileText, 
  DollarSign, 
  Activity,
  Calendar,
  Filter,
  X
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

function KPICard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend, 
  color = "primary" 
}: {
  title: string;
  value: string | number;
  description: string;
  icon: any;
  trend?: number;
  color?: "primary" | "secondary" | "success" | "warning";
}) {
  const colorClasses = {
    primary: "text-madera-natural bg-madera-natural/10",
    secondary: "text-terracota bg-terracota/10",
    success: "text-green-600 bg-green-100",
    warning: "text-yellow-600 bg-yellow-100",
  };

  return (
    <EnhancedCard hover className="relative overflow-hidden p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="absolute top-0 right-0 -mt-4 -mr-4 opacity-10">
        <Icon className="w-24 h-24" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
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
          {value}
        </h3>
        <p className="text-sm text-muted-foreground mb-2">
          {title}
        </p>
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      </div>
    </EnhancedCard>
  );
}

export default async function AdminDashboard({ searchParams }: PageProps) {
  try {
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
      rango.gte = new Date(`${fechaInicioFilter}T06:00:00.000Z`);
    }
    if (fechaFinFilter) {
      const endBase = new Date(`${fechaFinFilter}T06:00:00.000Z`);
      rango.lte = new Date(endBase.getTime() - 1);
    }

    ordenWhere.OR = [
      { fechaCreacion: rango },
      { fechaCompletado: rango },
    ];
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

  const totalProyectosGlobal = await prisma.proyecto.count();
  const totalArmadores = await prisma.armador.count();
  const armadoresActivos = await prisma.armador.count({ where: { estado: "ACTIVO" } });
  const proyectos = await prisma.proyecto.findMany({
    orderBy: { nombreComercial: "asc" },
    select: {
      id: true,
      nombreComercial: true,
    },
  });
  const totalOrdenes = await prisma.orden.count({ where: ordenWhere });
  const ordenesActivas = await prisma.orden.count({ where: activeWhere });
  
  // Calcular total facturado usando el sistema de facturación real
  let totalFacturadoCalculado = 0;
  
  // Si hay filtros de fecha, usar esos; si no, usar el mes actual
  const hoy = new Date();
  const primerDiaMes = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-01`;
  const ultimoDiaMes = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate()}`;
  
  const desdeParaFacturacion = fechaInicioFilter || primerDiaMes;
  const hastaParaFacturacion = fechaFinFilter || ultimoDiaMes;
  
  const billingData = await getBillingDataset({
    proyectoId: proyectoIdFilter,
    desde: desdeParaFacturacion,
    hasta: hastaParaFacturacion,
  });
  totalFacturadoCalculado = billingData?.totalsByConcept.totalFacturado ?? 0;
  
  const ordenesRecientes = await prisma.orden.findMany({
    where: ordenWhere,
    take: 10,
    orderBy: { createdAt: "desc" },
    include: {
      proyecto: { select: { nombreComercial: true } },
      armador: { include: { usuario: true } },
    },
  });

  const totalProyectos =
    proyectoIdFilter === "ALL"
      ? totalProyectosGlobal
      : proyectos.some((proyecto) => proyecto.id === proyectoIdFilter)
      ? 1
      : 0;

  const totalFacturado = totalFacturadoCalculado;

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
                Dashboard Admin
              </h1>
              <p className="text-muted-foreground text-lg">
                Bienvenido de vuelta, {usuario.nombre}. Aquí tienes el resumen operativo.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Última actualización</p>
                <p className="text-sm font-medium">
                  {new Date().toLocaleTimeString("es-SV", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    timeZone: "America/El_Salvador",
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <EnhancedCard hover className="mb-8 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center mb-6">
            <Filter className="w-5 h-5 mr-2 text-primary" />
            <h3 className="text-lg font-semibold">Filtros de métricas</h3>
          </div>
          <form className="grid gap-6 md:grid-cols-[repeat(auto-fit,minmax(250px,1fr))]" method="get">
            <div>
              <Label htmlFor="proyectoId" className="text-sm font-medium">Proyecto</Label>
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

            <div>
              <Label htmlFor="estado" className="text-sm font-medium">Estado de orden</Label>
              <select
                id="estado"
                name="estado"
                defaultValue={estadoFilter}
                className="w-full mt-1 rounded-lg border border-input bg-background px-4 py-3 text-sm uppercase focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              >
                <option value="ALL">Todos los estados</option>
                {ESTADOS_ORDEN.map((estado) => (
                  <option key={estado.value} value={estado.value}>
                    {estado.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="fechaInicio" className="text-sm font-medium">
                <Calendar className="w-4 h-4 inline mr-1" />
                Fecha desde
              </Label>
              <input
                type="date"
                id="fechaInicio"
                name="fechaInicio"
                defaultValue={fechaInicioFilter}
                className="w-full mt-1 rounded-lg border border-input bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>

            <div>
              <Label htmlFor="fechaFin" className="text-sm font-medium">
                <Calendar className="w-4 h-4 inline mr-1" />
                Fecha hasta
              </Label>
              <input
                type="date"
                id="fechaFin"
                name="fechaFin"
                defaultValue={fechaFinFilter}
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
              <Link href="/admin" prefetch={false}>
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

        {/* KPI Cards */}
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <KPICard
            title="Total de Proyectos"
            value={totalProyectos}
            description="Proyectos registrados en el sistema"
            icon={Package}
            color="primary"
          />
          <KPICard
            title="Total de Órdenes"
            value={totalOrdenes}
            description="Incluye órdenes completadas y en proceso"
            icon={FileText}
            color="secondary"
          />
          <KPICard
            title="Órdenes Activas"
            value={ordenesActivas}
            description="Órdenes pendientes de completar"
            icon={Activity}
            color="warning"
          />
          <KPICard
            title="Armadores Totales"
            value={totalArmadores}
            description="Total de armadores en el sistema"
            icon={Users}
            color="primary"
          />
          <KPICard
            title="Armadores Activos"
            value={armadoresActivos}
            description="Disponibles para asignación"
            icon={Users}
            color="success"
          />
          <KPICard
            title="Total Facturado"
            value={formatCurrency(totalFacturado)}
            description={fechaInicioFilter || fechaFinFilter ? "Basado en órdenes filtradas" : "Mes actual"}
            icon={DollarSign}
            color="success"
          />
        </section>

        {/* Tabla de Órdenes Recientes */}
        <section className="fade-in-up">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-foreground flex items-center">
              <FileText className="w-6 h-6 mr-2 text-primary" />
              Órdenes Recientes
            </h2>
            <Link href="/admin/ordenes">
              <EnhancedButton variant="outline" size="sm">
                Ver todas
              </EnhancedButton>
            </Link>
          </div>
          
          <EnhancedCard hover>
            <div className="rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Orden</TableHead>
                    <TableHead className="font-semibold">Proyecto</TableHead>
                    <TableHead className="font-semibold">Estado</TableHead>
                    <TableHead className="font-semibold">Armador</TableHead>
                    <TableHead className="font-semibold">Creada</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordenesRecientes.map((orden, index) => (
                    <TableRow 
                      key={orden.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <span className="mr-2 text-muted-foreground">#{index + 1}</span>
                          {orden.codigoReferenciaRetail}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Package className="w-4 h-4 mr-2 text-muted-foreground" />
                          {orden.proyecto?.nombreComercial ?? "Proyecto sin asignar"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getEstadoBadge(orden.estado)}>
                          {orden.estado.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                          {orden.armador?.usuario?.nombre ?? "No asignado"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-muted-foreground">
                          <Calendar className="w-4 h-4 mr-2" />
                          {orden.createdAt.toLocaleDateString("es-SV", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            timeZone: "America/El_Salvador",
                          })}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </EnhancedCard>
        </section>
      </main>
    </div>
  );
  } catch (error) {
    console.error("Error en AdminDashboard:", error);
    
    // Página de error simple para producción
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error en el Dashboard</h1>
          <p className="text-gray-600 mb-4">Ha ocurrido un error al cargar el dashboard.</p>
          <a href="/login" className="text-blue-600 hover:underline">
            Volver al login
          </a>
        </div>
      </div>
    );
  }
}
