"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Badge } from "@/components/ui/badge";
import { formatearFecha } from "@/lib/utils";
import { useEventStream } from "@/hooks/useEventStream";
import { TrackingBottomSheet } from "@/components/tracking-bottom-sheet";
import {
  Package,
  MapPin,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// Dynamic import to avoid SSR issues with Mapbox GL
const TrackingMap = dynamic(
  () => import("@/components/tracking-map").then((mod) => ({ default: mod.TrackingMap })),
  { ssr: false, loading: () => <div className="w-full h-full bg-slate-800 animate-pulse" /> }
);

interface RegistroEstado {
  estadoCambiadoA: string;
  timestamp: string;
  comentario: string | null;
}

interface EtaData {
  disponible: boolean;
  minutosEstimados: number | null;
  minutosMin: number | null;
  minutosMax: number | null;
  distanciaKm: number | null;
  horaLlegadaEstimada: string | null;
  duracionTexto: string | null;
  armadorUbicacion: {
    lat: number;
    lng: number;
    actualizadoHace: string;
  } | null;
  mensaje: string;
}

interface Orden {
  id: string;
  codigoReferenciaRetail: string;
  estado: string;
  fechaSolicitadaCliente: string | null;
  fechaAsignacion: string | null;
  fechaRuta: string | null;
  fechaInicioArmado: string | null;
  fechaFinArmado: string | null;
  fechaCompletado: string | null;
  mueble: {
    nombre: string;
    descripcion: string | null;
  };
  usuarioFinal: {
    nombre: string;
    municipio: string;
  };
  armador: {
    usuario: {
      nombre: string;
    };
  } | null;
  registrosEstado: RegistroEstado[];
}

const estadoTexto: Record<string, string> = {
  SIN_ASIGNAR: "Buscando armador",
  ASIGNADO: "Asignado",
  EN_RUTA: "En camino",
  ARMADO_INICIADO: "Armando",
  ARMADO_FINALIZADO: "Finalizado",
  ARMADO_COMPLETADO: "Completado",
};

const estadoColor: Record<string, string> = {
  SIN_ASIGNAR: "bg-gray-500",
  ASIGNADO: "bg-blue-500",
  EN_RUTA: "bg-amber-500",
  ARMADO_INICIADO: "bg-purple-500",
  ARMADO_FINALIZADO: "bg-indigo-500",
  ARMADO_COMPLETADO: "bg-emerald-500",
};

const estadoEmoji: Record<string, string> = {
  SIN_ASIGNAR: "⏳",
  ASIGNADO: "✅",
  EN_RUTA: "🚗",
  ARMADO_INICIADO: "🔧",
  ARMADO_FINALIZADO: "✨",
  ARMADO_COMPLETADO: "🎉",
};

// Simplified 4-step stepper for client
const stepperStates = ["ASIGNADO", "EN_RUTA", "ARMADO_INICIADO", "ARMADO_COMPLETADO"];
const stepperLabels = ["Asignado", "En camino", "Armando", "Listo"];

export default function SeguimientoPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const ordenId = params.id as string;
  const token = searchParams.get("token");

  const [orden, setOrden] = useState<Orden | null>(null);
  const [eta, setEta] = useState<EtaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [armadorPos, setArmadorPos] = useState<{ lat: number; lng: number } | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const fetchOrden = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/seguimiento/${ordenId}?token=${encodeURIComponent(token)}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Orden no encontrada");
      }
      const data = await res.json();
      setOrden(data.orden);
      setEta(data.eta || null);

      // Set initial armador position from ETA data
      if (data.eta?.armadorUbicacion) {
        setArmadorPos({
          lat: data.eta.armadorUbicacion.lat,
          lng: data.eta.armadorUbicacion.lng,
        });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al cargar la orden");
    } finally {
      setLoading(false);
    }
  }, [ordenId, token]);

  // SSE for real-time estado + ubicacion updates
  const { estado: estadoSSE, ubicacion: ubicacionSSE } = useEventStream(ordenId, token, {
    enabled: !!token,
    onEstadoChange: () => fetchOrden(),
    onUbicacionChange: (pos) => setArmadorPos(pos),
  });

  useEffect(() => {
    if (!token) {
      setError("Token de seguimiento requerido. Verifica el enlace proporcionado.");
      setLoading(false);
      return;
    }
    fetchOrden();
    const interval = setInterval(fetchOrden, 60000);
    return () => clearInterval(interval);
  }, [fetchOrden, token]);

  // Sync SSE estado
  useEffect(() => {
    if (estadoSSE && orden && estadoSSE !== orden.estado) {
      setOrden((prev) => (prev ? { ...prev, estado: estadoSSE } : prev));
    }
  }, [estadoSSE, orden]);

  // Update armador position from SSE
  useEffect(() => {
    if (ubicacionSSE) {
      setArmadorPos(ubicacionSSE);
    }
  }, [ubicacionSSE]);

  // --- LOADING STATE ---
  if (loading) {
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-white/20 border-t-white mx-auto" />
          <p className="mt-4 text-white/60 text-sm">Cargando seguimiento...</p>
        </div>
      </div>
    );
  }

  // --- ERROR STATE ---
  if (error || !orden) {
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className="bg-slate-800 rounded-2xl p-8 max-w-sm w-full text-center">
          <div className="w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-white font-semibold text-lg mb-2">Error</h2>
          <p className="text-white/60 text-sm">
            {error || "No se pudo cargar la informacion de la orden."}
          </p>
        </div>
      </div>
    );
  }

  // Compute stepper index
  let stepperEstado = orden.estado;
  if (stepperEstado === "ARMADO_FINALIZADO") stepperEstado = "ARMADO_COMPLETADO";
  const currentStepIndex = stepperStates.indexOf(stepperEstado);

  // Determine if map should show (EN_RUTA with position data)
  const showMap = (orden.estado === "EN_RUTA" || orden.estado === "ASIGNADO") && armadorPos;

  // Destination position (from ETA data or fallback)
  // Note: the API doesn't expose client coords to the public page for privacy.
  // We use null and let the map center on armador.
  const destinationPos = null;

  return (
    <div className="h-screen flex flex-col bg-slate-900 overflow-hidden">
      {/* ===== MAP SECTION ===== */}
      <div className={`relative ${showMap ? "flex-1" : "h-32 bg-gradient-to-b from-slate-800 to-slate-900"}`}>
        {showMap ? (
          <TrackingMap
            armadorPosition={armadorPos}
            destinationPosition={destinationPos}
            ordenId={ordenId}
            token={token || ""}
            className="w-full h-full"
          />
        ) : (
          /* Static header when no map */
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <span className="text-3xl">{estadoEmoji[orden.estado]}</span>
            </div>
          </div>
        )}

        {/* Header overlay */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-semibold text-sm">Armados 2Go</span>
          </div>
          <Badge className={`${estadoColor[orden.estado]} text-white text-xs px-3 py-1`}>
            {estadoTexto[orden.estado]}
          </Badge>
        </div>

        {/* Live indicator */}
        {showMap && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-slate-900/70 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            En vivo
          </div>
        )}
      </div>

      {/* ===== BOTTOM SHEET ===== */}
      <TrackingBottomSheet>
        {/* --- ETA HERO --- */}
        <div className="mb-5">
          {eta?.disponible ? (
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest font-medium mb-1">
                Llegada estimada
              </p>
              <div className="flex items-baseline justify-center gap-1">
                {eta.minutosMin && eta.minutosMax ? (
                  <span className="text-5xl font-bold text-gray-900 dark:text-white tabular-nums">
                    {eta.minutosMin}–{eta.minutosMax}
                  </span>
                ) : (
                  <span className="text-5xl font-bold text-gray-900 dark:text-white tabular-nums">
                    ~{eta.minutosEstimados}
                  </span>
                )}
                <span className="text-xl text-gray-500 dark:text-gray-400 font-medium">min</span>
              </div>
              {eta.horaLlegadaEstimada && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Hora aprox:{" "}
                  <span className="font-semibold text-gray-700 dark:text-gray-200">
                    {new Date(eta.horaLlegadaEstimada).toLocaleTimeString("es-SV", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </p>
              )}

              {/* Distance + Duration chips */}
              <div className="flex items-center justify-center gap-3 mt-3">
                {eta.distanciaKm && (
                  <span className="inline-flex items-center gap-1 text-xs bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-full">
                    <MapPin className="w-3 h-3" />
                    {eta.distanciaKm} km
                  </span>
                )}
                {eta.duracionTexto && (
                  <span className="inline-flex items-center gap-1 text-xs bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-full">
                    <Clock className="w-3 h-3" />
                    {eta.duracionTexto}
                  </span>
                )}
              </div>

              {/* Progress bar */}
              <div className="mt-4 w-full h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-1000"
                  style={{
                    width: `${Math.max(10, Math.min(90, 100 - (eta.minutosEstimados || 30)))}%`,
                  }}
                />
              </div>

              {eta.armadorUbicacion && (
                <p className="text-[11px] text-gray-400 mt-2">
                  GPS actualizado {eta.armadorUbicacion.actualizadoHace}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-2">
              <span className="text-3xl mb-2 block">{estadoEmoji[orden.estado]}</span>
              <p className="text-gray-600 dark:text-gray-300 text-base font-medium">
                {eta?.mensaje || estadoTexto[orden.estado]}
              </p>
            </div>
          )}
        </div>

        {/* --- STEPPER --- */}
        <div className="mb-5">
          <div className="flex items-center gap-1">
            {stepperStates.map((state, index) => {
              const isCompleted = currentStepIndex > index;
              const isCurrent = currentStepIndex === index;

              return (
                <div key={state} className="flex-1 flex flex-col items-center">
                  <div className="flex items-center w-full">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
                        isCurrent
                          ? "bg-blue-500 text-white ring-4 ring-blue-500/20"
                          : isCompleted
                          ? "bg-emerald-500 text-white"
                          : "bg-gray-200 dark:bg-slate-700 text-gray-400"
                      }`}
                    >
                      {isCompleted ? "✓" : index + 1}
                    </div>
                    {index < stepperStates.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 mx-1 transition-colors ${
                          currentStepIndex > index
                            ? "bg-emerald-500"
                            : "bg-gray-200 dark:bg-slate-700"
                        }`}
                      />
                    )}
                  </div>
                  <span
                    className={`text-[10px] mt-1.5 font-medium ${
                      isCurrent
                        ? "text-blue-600 dark:text-blue-400"
                        : isCompleted
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-gray-400"
                    }`}
                  >
                    {stepperLabels[index]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* --- ARMADOR INFO --- */}
        {orden.armador && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-xl mb-4">
            <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {orden.armador.usuario.nombre}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Tu armador asignado</p>
            </div>
          </div>
        )}

        {/* --- ORDER INFO --- */}
        <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-xl mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {orden.mueble.nombre}
                </p>
                <p className="text-xs text-gray-500">
                  Orden #{orden.codigoReferenciaRetail}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">{orden.usuarioFinal.municipio}</p>
            </div>
          </div>
        </div>

        {/* --- DETAILS TOGGLE --- */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-between py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700"
        >
          <span>Detalles y timeline</span>
          {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showDetails && (
          <div className="space-y-4 mt-2">
            {/* Timeline */}
            <div className="space-y-3">
              {orden.registrosEstado.length > 0 &&
                orden.registrosEstado.map((registro, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs">{estadoEmoji[registro.estadoCambiadoA]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {estadoTexto[registro.estadoCambiadoA] || registro.estadoCambiadoA}
                      </p>
                      <p className="text-xs text-gray-500">{formatearFecha(registro.timestamp)}</p>
                      {registro.comentario && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                          {registro.comentario}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
            </div>

            {/* Dates */}
            <div className="border-t dark:border-slate-700 pt-3 space-y-2">
              {orden.fechaSolicitadaCliente && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Fecha solicitada</span>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    {formatearFecha(orden.fechaSolicitadaCliente)}
                  </span>
                </div>
              )}
              {orden.fechaAsignacion && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Asignacion</span>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    {formatearFecha(orden.fechaAsignacion)}
                  </span>
                </div>
              )}
              {orden.fechaRuta && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">En ruta</span>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    {formatearFecha(orden.fechaRuta)}
                  </span>
                </div>
              )}
              {orden.fechaCompletado && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Completado</span>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    {formatearFecha(orden.fechaCompletado)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-[11px] text-gray-400">
            {showMap ? "Actualizaciones en tiempo real" : "Se actualiza automaticamente"} &bull; &copy;{" "}
            {new Date().getFullYear()} Armados 2Go
          </p>
        </div>
      </TrackingBottomSheet>
    </div>
  );
}
