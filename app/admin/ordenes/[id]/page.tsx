import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { AssignArmadorCard } from "@/components/assign-armador-card";
import { AutoAssignArmador } from "@/components/auto-assign-armador";
import { formatearFecha, formatCurrency } from "@/lib/utils";
import { OrderDeleteButton } from "@/components/order-delete-button";
import { OrderStatusTimeline } from "@/components/order-status-timeline";
import { AdminOrderActions } from "@/components/admin-order-actions";
import { Button } from "@/components/ui/button";
import { calcularCobroOrden } from "@/lib/facturacion-helpers";
import { OrdenRutaMapa } from "@/components/orden-ruta-mapa";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrdenDetallePage({ params }: PageProps) {
  const { id } = await params;
  const session = await getSession();

  if (!session || !["ADMIN", "SUPERVISOR"].includes(session.rol)) {
    redirect("/login");
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.userId },
  });

  if (!usuario) {
    redirect("/login");
  }

  const orden = await prisma.orden.findUnique({
    where: { id },
    include: {
      proyecto: {
        select: {
          nombreComercial: true,
          reglaCobro: {
            include: {
              rangosVolumen: true,
              cobrosDistancia: true,
              penalizaciones: true,
            },
          },
        },
      },
      mueble: true,
      usuarioFinal: true,
      armador: { include: { usuario: true } },
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
      penalizacionesAplicadas: true,
    },
  });

  if (!orden) {
    notFound();
  }

  const reglaCobro = orden.proyecto.reglaCobro
    ? {
        ...orden.proyecto.reglaCobro,
        rangosVolumen: orden.proyecto.reglaCobro.rangosVolumen,
        cobrosDistancia: orden.proyecto.reglaCobro.cobrosDistancia,
        penalizaciones: orden.proyecto.reglaCobro.penalizaciones,
      }
    : null;

  const calculoCobro =
    orden.estado === "ARMADO_COMPLETADO" && reglaCobro
      ? calcularCobroOrden({
          orden,
          usuarioFinal: orden.usuarioFinal,
          mueble: orden.mueble,
          reglaCobro,
          penalizacionesAplicadas: orden.penalizacionesAplicadas,
        })
      : null;

  return (
    <div className="min-h-screen">
      <Navbar user={usuario} />

      <main className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm text-gray-500">
              Orden #{orden.codigoReferenciaRetail}
            </p>
            <h1 className="text-3xl font-bold text-white">
              Detalle de la orden
            </h1>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  orden.estado === "ARMADO_COMPLETADO"
                    ? "success"
                    : orden.estado === "SIN_ASIGNAR"
                    ? "destructive"
                    : "warning"
                }
                className="uppercase"
              >
                {orden.estado.replace(/_/g, " ")}
              </Badge>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link href="/admin/ordenes">
                <Button variant="outline" size="sm">
                  ← Volver al listado
                </Button>
              </Link>
              <AdminOrderActions ordenId={orden.id} estado={orden.estado} />
              <OrderDeleteButton ordenId={orden.id} currentEstado={orden.estado} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Datos generales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-700">
              <div>
                <p className="font-semibold text-gray-900">Proyecto</p>
                <p>{orden.proyecto.nombreComercial}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Mueble</p>
                <p>
                  {orden.mueble.nombre} • {orden.mueble.tamano}
                  {orden.mueble.descripcion ? ` • ${orden.mueble.descripcion}` : ""}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold text-gray-900">Creada</p>
                  <p>{formatearFecha(orden.fechaCreacion)}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Fecha solicitada</p>
                  <p>
                    {orden.fechaSolicitadaCliente
                      ? formatearFecha(orden.fechaSolicitadaCliente)
                      : "—"}
                  </p>
                </div>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Monto</p>
                <p>
                  {calculoCobro && calculoCobro.total > 0
                    ? formatCurrency(calculoCobro.total)
                    : "No calculado"}
                </p>
                {calculoCobro && calculoCobro.conceptos.length > 0 ? (
                  <p className="mt-1 text-xs text-gray-500">
                    {calculoCobro.conceptos
                      .map((concepto) => {
                        const tipoLabel =
                          typeof concepto.tipo === "string"
                            ? concepto.tipo.toLowerCase()
                            : String(concepto.tipo ?? "");
                        return `${tipoLabel} ${formatCurrency(concepto.monto)}`;
                      })
                      .join(" • ")}
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cliente final</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-700">
              <div>
                <p className="font-semibold text-gray-900">Nombre</p>
                <p>{orden.usuarioFinal.nombre}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold text-gray-900">Teléfono</p>
                  <p>{orden.usuarioFinal.telefono}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Correo</p>
                  <p>{orden.usuarioFinal.email ?? "—"}</p>
                </div>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Dirección</p>
                <p>{orden.usuarioFinal.direccionCompleta}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold text-gray-900">Municipio</p>
                  <p>{orden.usuarioFinal.municipio}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Departamento</p>
                  <p>{orden.usuarioFinal.departamento}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Asignación de armador</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-gray-700">
              <div className="space-y-3">
                {orden.armador ? (
                  <>
                    <div>
                      <p className="font-semibold text-gray-900">Armador</p>
                      <p>{orden.armador.usuario.nombre}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="font-semibold text-gray-900">Teléfono</p>
                        <p>{orden.armador.usuario.telefono ?? "—"}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Correo</p>
                        <p>{orden.armador.usuario.email ?? "—"}</p>
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Asignada</p>
                      <p>
                        {orden.fechaAsignacion
                          ? formatearFecha(orden.fechaAsignacion)
                          : "—"}
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500">
                    Esta orden aún no tiene armador asignado.
                  </p>
                )}
              </div>

              <div className="border-t pt-4 space-y-4">
                <AssignArmadorCard
                  ordenId={orden.id}
                  currentArmadorId={orden.armador?.id ?? null}
                  currentArmadorNombre={orden.armador?.usuario.nombre ?? null}
                  currentArmadorTelefono={orden.armador?.usuario.telefono ?? null}
                  currentEstado={orden.estado}
                />

                <AutoAssignArmador ordenId={orden.id} currentEstado={orden.estado} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Archivos adjuntos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-700">
              {orden.archivos.length === 0 ? (
                <p className="text-gray-500">No hay archivos cargados.</p>
              ) : (
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
                          alt={`Archivo ${index + 1}`}
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
                        <Link
                          href={archivo.url}
                          target="_blank"
                          className="text-xs font-medium text-white underline opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Ver archivo
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Mapa de Ruta */}
        {orden.armador && (
          <OrdenRutaMapa ordenId={orden.id} />
        )}

        <Card>
          <CardHeader>
            <CardTitle>Historial de estados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-gray-700">
            <OrderStatusTimeline registros={orden.registrosEstado} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}