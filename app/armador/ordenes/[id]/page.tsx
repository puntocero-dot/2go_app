import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  Navigation,
  CheckCircle,
  Clock,
  Phone,
  ExternalLink,
  ImageIcon,
  XCircle,
} from "lucide-react";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { OrderStatusTimeline } from "@/components/order-status-timeline";
import { ArmadorEstadoActions } from "@/components/armador-estado-actions";
import { RutaSugeridaCardLazy } from "@/components/ruta-sugerida-card-lazy";
import { formatearFecha } from "@/lib/utils";
import { EstadoBadge } from "@/lib/orden-helpers";

type PageProps = {
  params: Promise<{ id: string }>;
};

function getProximoPasoDescripcion(estado: string): string {
  switch (estado) {
    case "ASIGNADO":
      return "Comienza tu viaje hacia el cliente.";
    case "EN_RUTA":
      return "Inicia el proceso de armado.";
    case "ARMADO_INICIADO":
      return "Finaliza el armado y prepara las evidencias.";
    case "ARMADO_FINALIZADO":
      return "Carga evidencias y marca la orden como completada.";
    case "ARMADO_COMPLETADO":
      return "Orden completada.";
    case "CANCELADA":
      return "Orden cancelada por el administrador.";
    default:
      return "Sin acciones pendientes.";
  }
}

function getInstruccionPaso(estado: string): string {
  switch (estado) {
    case "ASIGNADO":
      return "Cuando salgas hacia la ubicación del cliente, marca que iniciaste la ruta.";
    case "EN_RUTA":
      return "Cuando llegues al sitio y estés listo para armar, marca el inicio del armado.";
    case "ARMADO_INICIADO":
      return "Al terminar el armado, completa la orden subiendo fotos de evidencia.";
    case "ARMADO_FINALIZADO":
      return "Revisa que las evidencias estén completas antes de marcar la orden como finalizada.";
    case "ARMADO_COMPLETADO":
      return "Esta orden ya está completa. No hay acciones pendientes.";
    case "CANCELADA":
      return "Esta orden fue cancelada por el administrador. No debes realizar este servicio.";
    default:
      return "";
  }
}

export default async function ArmadorOrdenDetallePage({ params }: PageProps) {
  const { id } = await params;
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

  const armador = await prisma.armador.findUnique({
    where: { usuarioId: usuario.id },
  });

  if (!armador) {
    redirect("/armador");
  }

  const orden = await prisma.orden.findFirst({
    where: {
      id,
      armadorId: armador.id,
    },
    include: {
      proyecto: { select: { nombreComercial: true } },
      usuarioFinal: true,
      registrosEstado: {
        orderBy: { timestamp: "asc" },
        include: {
          usuario: {
            select: {
              nombre: true,
              email: true,
            },
          },
        },
      },
      archivos: true,
    },
  });

  if (!orden) {
    notFound();
  }

  const fechaProgramada = orden.fechaSolicitadaCliente ?? orden.fechaCreacion;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={usuario} />

      <main className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <p className="text-sm text-gray-500">
              Orden #{orden.codigoReferenciaRetail}
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold text-deep-navy">Detalle de la orden</h1>
              <EstadoBadge estado={orden.estado} />
            </div>
            <p className="text-sm text-gray-600">
              {orden.proyecto.nombreComercial} - {orden.usuarioFinal.nombre}
            </p>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <Link href="/armador" className="text-sm text-vibrant-cyan underline">
              Volver a mis ordenes
            </Link>
          </div>
        </div>

        <Card className="shadow-sm border-2 border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                {orden.estado === "ASIGNADO" && (
                  <Navigation className="h-5 w-5 text-primary" />
                )}
                {orden.estado === "EN_RUTA" && (
                  <Clock className="h-5 w-5 text-primary" />
                )}
                {(orden.estado === "ARMADO_INICIADO" ||
                  orden.estado === "ARMADO_FINALIZADO" ||
                  orden.estado === "ARMADO_COMPLETADO") && (
                  <CheckCircle className="h-5 w-5 text-primary" />
                )}
                {orden.estado === "CANCELADA" && (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
              <div>
                <CardTitle className="text-lg">Próximo paso</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {getProximoPasoDescripcion(orden.estado)}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {orden.estado === "ARMADO_COMPLETADO" ? (
              <p className="font-medium text-emerald-700">
                Esta orden ya está completada. No hay acciones pendientes.
              </p>
            ) : (
              <>
                <p className="mb-4 text-sm text-muted-foreground">
                  {getInstruccionPaso(orden.estado)}
                </p>
                <ArmadorEstadoActions ordenId={orden.id} estado={orden.estado} />
              </>
            )}
          </CardContent>
        </Card>

        {/* Mostrar ruta sugerida solo si la orden está ASIGNADO o EN_RUTA */}
        {(orden.estado === "ASIGNADO" || orden.estado === "EN_RUTA") && 
          orden.usuarioFinal.coordenadasLat != null && 
          orden.usuarioFinal.coordenadasLng != null && (
          <RutaSugeridaCardLazy
            ordenId={orden.id}
            destino={{
              lat: orden.usuarioFinal.coordenadasLat,
              lng: orden.usuarioFinal.coordenadasLng,
              direccion: orden.usuarioFinal.direccionCompleta || undefined,
            }}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Datos de la orden</CardTitle>
              <CardDescription>
                Información del proyecto y contacto del cliente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Proyecto</Label>
                  <p className="font-medium">{orden.proyecto.nombreComercial}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Cliente</Label>
                  <p className="font-medium">{orden.usuarioFinal.nombre}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Teléfono</Label>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{orden.usuarioFinal.telefono}</p>
                    {orden.usuarioFinal.telefono ? (
                      <Button size="sm" variant="outline" asChild>
                        <a href={`tel:${orden.usuarioFinal.telefono}`}>
                          <Phone className="h-4 w-4" />
                        </a>
                      </Button>
                    ) : null}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Dirección</Label>
                  <p className="font-medium line-clamp-2">
                    {orden.usuarioFinal.direccionCompleta}
                  </p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2 text-sm text-gray-700">
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Fecha programada</Label>
                  <p className="font-medium">{formatearFecha(fechaProgramada)}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Municipio</Label>
                  <p className="font-medium">{orden.usuarioFinal.municipio}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Historial de estados</CardTitle>
              <CardDescription>
                Fechas, horas y cambios de estado de la orden
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-gray-700">
              <OrderStatusTimeline registros={orden.registrosEstado} />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Evidencias</CardTitle>
              <CardDescription>Fotos y videos del trabajo completado</CardDescription>
            </CardHeader>
            <CardContent>
              {orden.archivos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {orden.archivos.map((archivo, index) => (
                    <div
                      key={archivo.id}
                      className="relative aspect-square rounded-lg overflow-hidden border group"
                    >
                      {archivo.tipo === "FOTO" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={archivo.url}
                          alt={`Evidencia ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video
                          src={archivo.url}
                          className="w-full h-full object-cover"
                          controls
                        />
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          asChild
                        >
                          <a
                            href={archivo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Abrir
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Aún no hay evidencias adjuntas</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
