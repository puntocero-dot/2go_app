import { redirect } from "next/navigation";
import Link from "next/link";
import { isToday, isTomorrow, format } from "date-fns";
import { es } from "date-fns/locale";
import { toZonedTime, format as formatTz } from "date-fns-tz";
import { Clock, User, MapPin, ChevronRight, Inbox } from "lucide-react";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { ArmadorGpsTracker } from "@/components/armador-gps-tracker";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { EstadoBadge } from "@/lib/orden-helpers";

function getFechaBadge(fecha: Date) {
  if (isToday(fecha)) {
    return {
      texto: "HOY",
      variant: "default" as const,
      className: "bg-red-500 hover:bg-red-600",
    };
  }

  if (isTomorrow(fecha)) {
    return {
      texto: "MAÑANA",
      variant: "secondary" as const,
      className: "bg-yellow-500 hover:bg-yellow-600",
    };
  }

  return {
    texto: format(fecha, "d 'de' MMM", { locale: es }),
    variant: "outline" as const,
    className: "",
  };
}

export default async function ArmadorDashboard() {
  const session = await getSession();

  if (!session || session.rol !== "ARMADOR") {
    redirect("/login");
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.userId },
  });

  if (!usuario) {
    redirect("/login");
  }

  // Buscar el armador asociado y su turno activo
  const armador = await prisma.armador.findUnique({
    where: { usuarioId: usuario.id },
    include: {
      turnos: {
        where: { estado: "ACTIVO" },
        orderBy: { inicioTurno: "desc" },
        take: 1,
      },
    },
  });

  if (!armador) {
    return (
      <div className="min-h-screen">
        <Navbar user={usuario} />
        <main className="container mx-auto px-4 py-8">
          <Card glass>
            <CardContent className="pt-6 text-center py-10">
              <p className="text-white/50">
                No tienes un perfil de armador configurado. Contacta al administrador.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Obtener órdenes del armador
  const [misOrdenes, ordenesActivas, ordenesCompletadas] =
    await Promise.all([
      prisma.orden.findMany({
        where: { armadorId: armador.id },
        orderBy: [
          { fechaSolicitadaCliente: "asc" },
          { fechaCreacion: "asc" },
        ],
        include: {
          proyecto: true,
          usuarioFinal: true,
        },
      }),
      prisma.orden.count({
        where: {
          armadorId: armador.id,
          estado: {
            in: ["ASIGNADO", "EN_RUTA", "ARMADO_INICIADO"],
          },
        },
      }),
      prisma.orden.count({
        where: {
          armadorId: armador.id,
          estado: "ARMADO_COMPLETADO",
        },
      }),
    ]);

  return (
    <div className="min-h-screen">
      <Navbar user={usuario} />

      <main className="container mx-auto px-4 py-8">
        <ArmadorGpsTracker />

        {/* Indicador de Turno Activo */}
        {armador.turnos.length > 0 && (
          <div className="mb-6 bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="h-2.5 w-2.5 bg-emerald-400 rounded-full animate-pulse" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-emerald-300">
                  Turno Activo
                </p>
                <p className="text-xs text-emerald-400/70 mt-0.5">
                  Iniciado: {formatTz(toZonedTime(new Date(armador.turnos[0].inicioTurno), "America/El_Salvador"), "HH:mm", { locale: es })} •
                  Tu ubicación GPS está siendo registrada
                </p>
              </div>
              <div className="flex-shrink-0">
                <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30">
                  🟢 En línea
                </Badge>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8 fade-in">
          <h1 className="text-3xl font-bold text-gradient mb-2">Mis Órdenes</h1>
          <p className="text-white/50">Gestiona tus asignaciones de armado</p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card glass hover>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-5 sm:pb-2">
              <CardTitle className="text-sm font-medium text-white/60">Órdenes Activas</CardTitle>
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center">
                <span className="text-sm">⚡</span>
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-5 sm:pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-white">{ordenesActivas}</div>
              <p className="text-xs text-white/35 mt-0.5">En proceso</p>
            </CardContent>
          </Card>

          <Card glass hover>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-5 sm:pb-2">
              <CardTitle className="text-sm font-medium text-white/60">Completadas</CardTitle>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                <span className="text-sm">✅</span>
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-5 sm:pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-white">{ordenesCompletadas}</div>
              <p className="text-xs text-white/35 mt-0.5">Finalizadas</p>
            </CardContent>
          </Card>

          <Card glass hover>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-5 sm:pb-2">
              <CardTitle className="text-sm font-medium text-white/60">Total</CardTitle>
              <div className="w-8 h-8 rounded-xl bg-cyan-500/15 flex items-center justify-center">
                <span className="text-sm">📦</span>
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-5 sm:pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-white">{misOrdenes.length}</div>
              <p className="text-xs text-white/35 mt-0.5">Asignadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Órdenes */}
        <Card>
          <CardHeader>
            <CardTitle>Mis Asignaciones</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Desktop: tabla */}
            <div className="hidden lg:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Orden</TableHead>
                    <TableHead>Proyecto</TableHead>
                    <TableHead>Dirección</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Cita</TableHead>
                    <TableHead>Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {misOrdenes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <div className="text-center py-12">
                          <div className="flex flex-col items-center gap-3">
                            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                              <Inbox className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-base">No tienes órdenes asignadas</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                Las nuevas órdenes aparecerán aquí cuando te sean asignadas
                              </p>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    misOrdenes.map((orden) => {
                      const fechaBase = orden.fechaSolicitadaCliente ?? orden.fechaCreacion;
                      const fechaEntrega = new Date(fechaBase);
                      const esHoy = isToday(fechaEntrega);
                      const fechaBadge = getFechaBadge(fechaEntrega);

                      return (
                        <TableRow
                          key={orden.id}
                          className={cn(
                            "hover:bg-muted/50",
                            esHoy && "bg-red-500/10 hover:bg-red-500/15",
                          )}
                        >
                          <TableCell className="font-mono text-xs">
                            <span>#{orden.codigoReferenciaRetail}</span>
                          </TableCell>

                          <TableCell className="font-medium">
                            {orden.proyecto.nombreComercial}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {orden.usuarioFinal.direccionCompleta}
                          </TableCell>
                          <TableCell>{orden.usuarioFinal.nombre}</TableCell>
                          <TableCell>
                            <div className="inline-flex min-w-[140px] justify-center">
                              <EstadoBadge estado={orden.estado} />
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="flex items-center gap-2 tabular-nums">
                              {esHoy && <Clock className="h-4 w-4 text-red-500" />}
                              <Badge
                                variant={fechaBadge.variant}
                                className={cn("min-w-[96px] justify-center", fechaBadge.className)}
                              >
                                {fechaBadge.texto}
                              </Badge>
                            </div>
                          </TableCell>

                          <TableCell>
                            <Link
                              href={`/armador/ordenes/${orden.id}`}
                              className="text-sm font-medium text-vibrant-cyan underline"
                            >
                              Ver detalle
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile: cards */}
            <div className="lg:hidden space-y-3">
              {misOrdenes.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-sm">No tienes órdenes asignadas</p>
                </div>
              ) : (
                misOrdenes.map((orden) => {
                  const fechaBase = orden.fechaSolicitadaCliente ?? orden.fechaCreacion;
                  const fechaEntrega = new Date(fechaBase);
                  const esHoy = isToday(fechaEntrega);
                  const fechaBadge = getFechaBadge(fechaEntrega);

                  return (
                    <Link
                      key={orden.id}
                      href={`/armador/ordenes/${orden.id}`}
                      className="block"
                    >
                      <Card
                        className={cn(
                          "cursor-pointer hover:shadow-md transition-shadow overflow-hidden",
                          esHoy && "border-red-500/60 border-2 bg-red-500/10",
                        )}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                {esHoy && (
                                  <Clock className="h-4 w-4 text-red-500 flex-shrink-0" />
                                )}
                                <span className="font-mono text-xs text-muted-foreground">
                                  #{orden.codigoReferenciaRetail}
                                </span>
                                <Badge
                                  variant={fechaBadge.variant}
                                  className={fechaBadge.className}
                                >
                                  {fechaBadge.texto}
                                </Badge>
                              </div>
                              <CardTitle className="text-base line-clamp-1">
                                {orden.proyecto.nombreComercial}
                              </CardTitle>
                            </div>
                            <EstadoBadge estado={orden.estado} />
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <User className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground line-clamp-1">
                              {orden.usuarioFinal.nombre}
                            </span>
                          </div>

                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground line-clamp-2 text-xs">
                              {orden.usuarioFinal.direccionCompleta}
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t">
                            <span className="text-xs text-muted-foreground">
                              {fechaEntrega.toLocaleDateString("es-SV")}
                            </span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

      </main>
    </div>
  );
}