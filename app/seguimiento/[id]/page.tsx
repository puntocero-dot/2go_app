"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatearFecha } from "@/lib/utils";

interface RegistroEstado {
  id: string;
  estadoAnterior: string;
  estadoNuevo: string;
  fecha: string;
  comentario: string | null;
  usuario: {
    nombre: string;
  };
}

interface Orden {
  id: string;
  codigoReferenciaRetail: string;
  estado: string;
  fechaCreacion: string;
  fechaAsignacion: string | null;
  fechaEnRuta: string | null;
  fechaArmadoIniciado: string | null;
  fechaArmadoFinalizado: string | null;
  fechaArmadoCompletado: string | null;
  mueble: {
    nombre: string;
    descripcion: string | null;
  };
  usuarioFinal: {
    nombre: string;
    direccion: string;
    municipio: string;
    telefono: string | null;
  };
  armador: {
    usuario: {
      nombre: string;
      telefono: string | null;
    };
  } | null;
  registrosEstado: RegistroEstado[];
}

export default function SeguimientoPage() {
  const params = useParams();
  const ordenId = params.id as string;

  const [orden, setOrden] = useState<Orden | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrden() {
      try {
        const res = await fetch(`/api/seguimiento/${ordenId}`);
        if (!res.ok) {
          throw new Error("Orden no encontrada");
        }
        const data = await res.json();
        setOrden(data.orden);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchOrden();
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchOrden, 30000);
    return () => clearInterval(interval);
  }, [ordenId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando información...</p>
        </div>
      </div>
    );
  }

  if (error || !orden) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              {error || "No se pudo cargar la información de la orden."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const estadoColor: Record<string, string> = {
    SIN_ASIGNAR: "bg-gray-500",
    ASIGNADO: "bg-blue-500",
    EN_RUTA: "bg-yellow-500",
    ARMADO_INICIADO: "bg-orange-500",
    ARMADO_FINALIZADO: "bg-purple-500",
    ARMADO_COMPLETADO: "bg-green-500",
  };

  const estadoTexto: Record<string, string> = {
    SIN_ASIGNAR: "Sin Asignar",
    ASIGNADO: "Asignado",
    EN_RUTA: "En Ruta",
    ARMADO_INICIADO: "Armado Iniciado",
    ARMADO_FINALIZADO: "Armado Finalizado",
    ARMADO_COMPLETADO: "Completado",
  };

  const estadoEmoji: Record<string, string> = {
    SIN_ASIGNAR: "⏳",
    ASIGNADO: "✅",
    EN_RUTA: "🚗",
    ARMADO_INICIADO: "🔧",
    ARMADO_FINALIZADO: "✨",
    ARMADO_COMPLETADO: "🎉",
  };

  const estadosOrdenados: string[] = [
    "SIN_ASIGNAR",
    "ASIGNADO",
    "EN_RUTA",
    "ARMADO_INICIADO",
    "ARMADO_FINALIZADO",
    "ARMADO_COMPLETADO",
  ];

  const currentIndex = estadosOrdenados.indexOf(orden.estado);

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-cyan-600 mb-2">
            Armados 2Go
          </h1>
          <p className="text-gray-600">Seguimiento de tu Orden</p>
        </div>

        {/* Estado Actual */}
        <Card className="border-2 border-cyan-200">
          <CardHeader className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white">
            <CardTitle className="text-2xl">
              {estadoEmoji[orden.estado]} Estado Actual
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-center">
              <Badge
                className={`${estadoColor[orden.estado]} text-white text-lg px-6 py-2`}
              >
                {estadoTexto[orden.estado]}
              </Badge>
              <p className="text-gray-600 mt-4">
                Orden: <strong>{orden.codigoReferenciaRetail}</strong>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Progreso por estados */}
        <Card>
          <CardHeader>
            <CardTitle>Progreso de tu servicio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
              {estadosOrdenados.map((estado, index) => {
                const isCompleted = currentIndex > index;
                const isCurrent = currentIndex === index;

                return (
                  <div
                    key={estado}
                    className="flex-1 min-w-[72px] text-center"
                  >
                    <div className="flex items-center">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-semibold ${
                          isCurrent
                            ? "border-cyan-600 bg-cyan-600 text-white"
                            : isCompleted
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-gray-300 bg-white text-gray-500"
                        }`}
                      >
                        {estadoEmoji[estado]}
                      </div>
                      {index < estadosOrdenados.length - 1 && (
                        <div
                          className={`mx-1 h-0.5 flex-1 ${
                            currentIndex > index ? "bg-emerald-500" : "bg-gray-200"
                          }`}
                        />
                      )}
                    </div>
                    <div className="mt-2 text-[11px] font-medium text-gray-600 uppercase tracking-tight">
                      {estadoTexto[estado]}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Información del Mueble */}
        <Card>
          <CardHeader>
            <CardTitle>📦 Información del Mueble</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>
                <strong>Mueble:</strong> {orden.mueble.nombre}
              </p>
              {orden.mueble.descripcion && (
                <p>
                  <strong>Descripción:</strong> {orden.mueble.descripcion}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Información del Cliente */}
        <Card>
          <CardHeader>
            <CardTitle>👤 Información de Entrega</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>
                <strong>Cliente:</strong> {orden.usuarioFinal.nombre}
              </p>
              <p>
                <strong>Dirección:</strong> {orden.usuarioFinal.direccion}
              </p>
              <p>
                <strong>Municipio:</strong> {orden.usuarioFinal.municipio}
              </p>
              {orden.usuarioFinal.telefono && (
                <p>
                  <strong>Teléfono:</strong> {orden.usuarioFinal.telefono}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Armador Asignado */}
        {orden.armador && (
          <Card>
            <CardHeader>
              <CardTitle>🔧 Armador Asignado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>
                  <strong>Nombre:</strong> {orden.armador.usuario.nombre}
                </p>
                {orden.armador.usuario.telefono && (
                  <p>
                    <strong>Teléfono:</strong> {orden.armador.usuario.telefono}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Historial de Estados */}
        <Card>
          <CardHeader>
            <CardTitle>📋 Historial de Estados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {orden.registrosEstado.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No hay cambios de estado registrados aún.
                </p>
              ) : (
                orden.registrosEstado.map((registro) => (
                  <div
                    key={registro.id}
                    className="border-l-4 border-cyan-500 pl-4 py-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">
                          {estadoEmoji[registro.estadoNuevo]}{" "}
                          {estadoTexto[registro.estadoNuevo]}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatearFecha(registro.fecha)}
                        </p>
                        {registro.comentario && (
                          <p className="text-sm text-gray-700 mt-1">
                            💬 {registro.comentario}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {registro.usuario.nombre}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Timeline de Fechas */}
        <Card>
          <CardHeader>
            <CardTitle>⏱️ Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Creación:</span>
                <span className="font-semibold">
                  {formatearFecha(orden.fechaCreacion)}
                </span>
              </div>
              {orden.fechaAsignacion && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Asignación:</span>
                  <span className="font-semibold">
                    {formatearFecha(orden.fechaAsignacion)}
                  </span>
                </div>
              )}
              {orden.fechaEnRuta && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">En Ruta:</span>
                  <span className="font-semibold">
                    {formatearFecha(orden.fechaEnRuta)}
                  </span>
                </div>
              )}
              {orden.fechaArmadoIniciado && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Armado Iniciado:</span>
                  <span className="font-semibold">
                    {formatearFecha(orden.fechaArmadoIniciado)}
                  </span>
                </div>
              )}
              {orden.fechaArmadoFinalizado && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Armado Finalizado:</span>
                  <span className="font-semibold">
                    {formatearFecha(orden.fechaArmadoFinalizado)}
                  </span>
                </div>
              )}
              {orden.fechaArmadoCompletado && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Completado:</span>
                  <span className="font-semibold">
                    {formatearFecha(orden.fechaArmadoCompletado)}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm mt-8">
          <p>Esta página se actualiza automáticamente cada 30 segundos</p>
          <p className="mt-2">© 2024 Armados 2Go - Todos los derechos reservados</p>
        </div>
      </div>
    </div>
  );
}