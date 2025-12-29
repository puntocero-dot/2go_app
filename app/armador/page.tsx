import { redirect } from "next/navigation";
import Link from "next/link";
import { isToday, isTomorrow, format } from "date-fns";
import { es } from "date-fns/locale";
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
import { cn, formatearFecha } from "@/lib/utils";
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
      <div className="min-h-screen bg-gray-50">
        <Navbar user={usuario} />
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
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
    <div className="min-h-screen bg-gray-50">
      <Navbar user={usuario} />
      
      <main className="container mx-auto px-4 py-8">
        <ArmadorGpsTracker />
        
        {/* Indicador de Turno Activo */}
        {armador.turnos.length > 0 && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">
                  Turno Activo
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Iniciado: {format(new Date(armador.turnos[0].inicioTurno), "HH:mm", { locale: es })} • 
                  Tu ubicación GPS está siendo registrada
                </p>
              </div>
              <div className="flex-shrink-0">
                <Badge className="bg-green-600 hover:bg-green-700">
                  🟢 En línea
                </Badge>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-deep-navy">Mis Órdenes</h1>
          <p className="text-gray-600 mt-2">
            Gestiona tus asignaciones de armado
          </p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Órdenes Activas
              </CardTitle>
              <div className="text-2xl">⚡</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ordenesActivas}</div>
              <p className="text-xs text-muted-foreground">
                En proceso
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Completadas
              </CardTitle>
              <div className="text-2xl">✅</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ordenesCompletadas}</div>
              <p className="text-xs text-muted-foreground">
                Trabajos finalizados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Órdenes
              </CardTitle>
              <div className="text-2xl">📦</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{misOrdenes.length}</div>
              <p className="text-xs text-muted-foreground">
                Asignadas
              </p>
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
            <div className="hidden md:block">
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
                            esHoy && "bg-red-50 hover:bg-red-100",
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
            <div className="md:hidden space-y-3">
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
                          "cursor-pointer hover:shadow-md transition-shadow",
                          esHoy && "border-red-500 border-2 bg-red-50",
                        )}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
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