import { redirect } from "next/navigation";
import type { EstadoOrden } from "@prisma/client";
import Link from "next/link";

import { Navbar } from "@/components/navbar";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
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
import {
  Clock,
  FileText,
  Package,
  Users,
  Calendar,
  Filter,
  TrendingUp,
  Timer,
  CheckCircle,
  AlertTriangle,
  BarChart3
} from "lucide-react";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const ESTADOS_ORDEN: { value: "" | EstadoOrden; label: string; color: string }[] = [
  { value: "", label: "Todos los estados", color: "bg-gray-100 text-gray-800" },
  { value: "SIN_ASIGNAR", label: "Sin asignar", color: "bg-gray-100 text-gray-800" },
  { value: "ASIGNADO", label: "Asignado", color: "bg-blue-100 text-blue-800" },
  { value: "EN_RUTA", label: "En ruta", color: "bg-yellow-100 text-yellow-800" },
  { value: "ARMADO_INICIADO", label: "Armado iniciado", color: "bg-purple-100 text-purple-800" },
  { value: "ARMADO_FINALIZADO", label: "Armado finalizado", color: "bg-indigo-100 text-indigo-800" },
  { value: "ARMADO_COMPLETADO", label: "Armado completado", color: "bg-green-100 text-green-800" },
  { value: "CANCELADA", label: "Cancelada", color: "bg-red-100 text-red-800" },
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

function formatSecondsToHours(seconds: number): string {
  const hours = seconds / 3600;
  return hours.toFixed(2);
}

function StatsCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  color = "primary",
  subtitle
}: {
  title: string;
  value: string | number;
  description: string;
  icon: any;
  color?: "primary" | "secondary" | "success" | "warning" | "info";
  subtitle?: string;
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
        {subtitle && (
          <p className="text-xs text-primary mt-2 font-medium">
            {subtitle}
          </p>
        )}
      </div>
    </EnhancedCard>
  );
}

function EstadoBadge({ estado }: { estado: string }) {
  const estadoConfig = ESTADOS_ORDEN.find(e => e.value === estado) || ESTADOS_ORDEN[0];
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${estadoConfig.color}`}>
      {estadoConfig.label}
    </span>
  );
}

export default async function TiemposPedidoPage({ searchParams }: PageProps) {
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

  // Parse search params
  const proyectoIdFilter =
    typeof currentSearchParams?.proyectoId === "string" && currentSearchParams.proyectoId !== ""
      ? currentSearchParams.proyectoId
      : "ALL";
  const estadoFilter =
    typeof currentSearchParams?.estado === "string" ? currentSearchParams.estado : "";
  const fechaInicioFilter =
    typeof currentSearchParams?.fechaInicio === "string"
      ? currentSearchParams.fechaInicio
      : "";
  const fechaFinFilter =
    typeof currentSearchParams?.fechaFin === "string" ? currentSearchParams.fechaFin : "";

  if (!fechaInicioFilter || !fechaFinFilter) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <Navbar
          user={{
            nombre: usuario?.nombre || "",
            email: usuario?.email || "",
            rol: session?.rol as any,
            estadoLoggeo: usuario?.estadoLoggeo ?? undefined,
          }}
        />
        <div className="max-w-5xl mx-auto px-4 py-10">
          <EnhancedCard className="p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
              <div>
                <h2 className="text-lg font-semibold">Selecciona un rango de fechas</h2>
                <p className="text-sm text-muted-foreground">
                  Debes elegir fecha inicio y fecha fin para generar el reporte de tiempos.
                </p>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Link href="/admin/reportes/tiempos-pedido">
                <EnhancedButton variant="default">Volver a filtros</EnhancedButton>
              </Link>
            </div>
          </EnhancedCard>
        </div>
      </div>
    );
  }

  // Build where clause
  const where: any = {};
  if (proyectoIdFilter !== "ALL") {
    where.proyectoId = proyectoIdFilter;
  }
  if (estadoFilter) {
    where.estado = estadoFilter;
  }
  if (fechaInicioFilter || fechaFinFilter) {
    where.fechaCreacion = {};
    if (fechaInicioFilter) {
      where.fechaCreacion.gte = new Date(`${fechaInicioFilter}T00:00:00.000Z`);
    }
    if (fechaFinFilter) {
      where.fechaCreacion.lte = new Date(`${fechaFinFilter}T23:59:59.999Z`);
    }
  }

  // Get data
  const [proyectos, ordenes] = await Promise.all([
    prisma.proyecto.findMany({
      orderBy: { nombreComercial: "asc" },
      select: { id: true, nombreComercial: true },
    }),
    prisma.orden.findMany({
      where,
      orderBy: { fechaCreacion: "desc" },
      take: 100,
      include: {
        proyecto: { select: { nombreComercial: true } },
        armador: { include: { usuario: { select: { nombre: true } } } },
      },
    }),
  ]);

  const fechaFinLimite = fechaFinFilter
    ? new Date(`${fechaFinFilter}T23:59:59.999Z`)
    : new Date();

  // Process report data
  const reportRows: ReportRow[] = ordenes.map((orden) => {
    const endDate = orden.fechaCompletado
      ? orden.fechaCompletado
      : fechaFinLimite < new Date()
      ? fechaFinLimite
      : new Date();

    const tiempoTotalSegundos = Math.max(
      0,
      Math.floor((endDate.getTime() - orden.fechaCreacion.getTime()) / 1000)
    );

    return {
      ordenId: orden.id,
      codigoReferenciaRetail: orden.codigoReferenciaRetail,
      proyecto: orden.proyecto.nombreComercial,
      armador: orden.armador?.usuario.nombre ?? null,
      estadoActual: orden.estado,
      fechaCreacion: orden.fechaCreacion,
      fechaCompletado: orden.fechaCompletado,
      tiempoTotalSegundos,
    };
  });

  // Calculate statistics
  const totalOrdenes = reportRows.length;
  const completadasRows = reportRows.filter(r => r.fechaCompletado);
  const ordenesCompletadas = completadasRows.length;
  const tiempoPromedioSegundos = ordenesCompletadas > 0
    ? completadasRows.reduce((sum, r) => sum + r.tiempoTotalSegundos, 0) / ordenesCompletadas
    : 0;
  const tiempoPromedioCompletadasSegundos = tiempoPromedioSegundos;

  const hasData = reportRows.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <Navbar user={usuario} />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gradient mb-2">
                Reporte de Tiempos de Pedido
              </h1>
              <p className="text-muted-foreground text-lg">
                Analiza los tiempos de procesamiento y entrega de órdenes.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-primary mr-2" />
              <span className="text-sm text-muted-foreground">
                Reporte en tiempo real
              </span>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <EnhancedCard hover className="mb-8 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center mb-6">
            <Filter className="w-5 h-5 mr-2 text-primary" />
            <h3 className="text-lg font-semibold">Filtros del reporte</h3>
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
              <Label htmlFor="estado" className="text-sm font-medium">Estado</Label>
              <select
                id="estado"
                name="estado"
                defaultValue={estadoFilter}
                className="w-full mt-1 rounded-lg border border-input bg-background px-4 py-3 text-sm uppercase focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              >
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

            <div>
              <Label htmlFor="fechaFin" className="text-sm font-medium">
                <Calendar className="w-4 h-4 inline mr-1" />
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

            <div className="md:col-span-full flex items-center flex-wrap gap-3 pt-2">
              <EnhancedButton
                type="submit"
                className="min-w-[140px]"
              >
                <Filter className="w-4 h-4 mr-2" />
                Aplicar filtros
              </EnhancedButton>
              <Link href="/admin/reportes/tiempos-pedido" prefetch={false}>
                <EnhancedButton variant="outline" className="min-w-[100px]">
                  Limpiar
                </EnhancedButton>
              </Link>
            </div>
          </form>
        </EnhancedCard>

        {hasData ? (
          <>
            {/* Estadísticas */}
            <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <StatsCard
                title="Total de Órdenes"
                value={totalOrdenes}
                description="Órdenes en el rango seleccionado"
                icon={FileText}
                color="primary"
              />
              <StatsCard
                title="Órdenes Completadas"
                value={ordenesCompletadas}
                description="Órdenes finalizadas"
                icon={CheckCircle}
                color="success"
                subtitle={`${totalOrdenes > 0 ? Math.round((ordenesCompletadas / totalOrdenes) * 100) : 0}% de completion`}
              />
              <StatsCard
                title="Tiempo Promedio Total"
                value={formatSecondsToLabel(tiempoPromedioSegundos)}
                description="Incluyendo órdenes en proceso"
                icon={Timer}
                color="warning"
                subtitle={`${formatSecondsToHours(tiempoPromedioSegundos)} horas`}
              />
              <StatsCard
                title="Tiempo Promedio Completadas"
                value={formatSecondsToLabel(tiempoPromedioCompletadasSegundos)}
                description="Solo órdenes finalizadas"
                icon={Clock}
                color="info"
                subtitle={`${formatSecondsToHours(tiempoPromedioCompletadasSegundos)} horas`}
              />
            </section>

            {/* Tabla de detalles */}
            <section className="fade-in-up">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-foreground flex items-center">
                  <Clock className="w-6 h-6 mr-2 text-primary" />
                  Detalle de Tiempos por Orden
                  <span className="ml-3 text-sm text-muted-foreground">
                    ({reportRows.length} registros)
                  </span>
                </h2>
                <div className="flex items-center space-x-2">
                  <EnhancedButton variant="outline" size="sm">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Exportar CSV
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
                        <TableHead className="font-semibold">Armador</TableHead>
                        <TableHead className="font-semibold">Estado</TableHead>
                        <TableHead className="font-semibold">Fecha Creación</TableHead>
                        <TableHead className="font-semibold">Tiempo Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportRows.map((row, index) => (
                        <TableRow 
                          key={row.ordenId}
                          className="hover:bg-muted/30 transition-colors cursor-pointer"
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <FileText className="w-4 h-4 mr-2 text-muted-foreground" />
                              <span className="mr-2 text-muted-foreground">#{index + 1}</span>
                              {row.codigoReferenciaRetail}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Package className="w-4 h-4 mr-2 text-muted-foreground" />
                              {row.proyecto}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {row.armador ? (
                                <>
                                  <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                                  {row.armador}
                                </>
                              ) : (
                                <span className="text-muted-foreground italic">No asignado</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <EstadoBadge estado={row.estadoActual} />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-muted-foreground">
                              <Calendar className="w-4 h-4 mr-2" />
                              <div>
                                <div className="text-sm">
                                  {row.fechaCreacion.toLocaleDateString("es-ES")}
                                </div>
                                <div className="text-xs">
                                  {row.fechaCreacion.toLocaleTimeString("es-ES", {
                                    hour: "2-digit",
                                    minute: "2-digit"
                                  })}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                              <div>
                                <div className="font-medium">
                                  {formatSecondsToLabel(row.tiempoTotalSegundos)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {formatSecondsToHours(row.tiempoTotalSegundos)}h
                                </div>
                              </div>
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
            title="No hay datos de tiempos"
            description="No se encontraron registros de tiempos para los filtros seleccionados."
            action={{
              label: "Limpiar filtros",
              onClick: () => {
                window.location.href = "/admin/reportes/tiempos-pedido";
              }
            }}
          />
        )}
      </main>
    </div>
  );
}
