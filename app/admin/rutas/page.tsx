"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/navbar";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { Label } from "@/components/ui/label";
import { useRutaTurno } from "@/hooks/useRutaTurno";
import { calcularDistanciaTotal, formatearDistancia, calcularDuracion } from "@/lib/geolocation";
import { Loader2, MapPin, Clock, Route, User as UserIcon, PauseCircle, AlertTriangle, CheckCircle2 } from "lucide-react";

const MapaRutaArmador = dynamic(() => import("@/components/MapaRutaArmador").then(mod => ({ default: mod.MapaRutaArmador })), {
  loading: () => <div className="flex items-center justify-center h-full bg-slate-900/50"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>,
  ssr: false,
});

export default function RutasPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [armadores, setArmadores] = useState<any[]>([]);
  const [armadorSeleccionado, setArmadorSeleccionado] = useState<string>("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [turnos, setTurnos] = useState<any[]>([]);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState<string | null>(null);
  const [loadingTurnos, setLoadingTurnos] = useState(false);

  const { turno, loading: loadingRuta, error } = useRutaTurno(turnoSeleccionado);

  useEffect(() => {
    cargarUsuario();
    cargarArmadores();
  }, []);

  useEffect(() => {
    if (armadorSeleccionado) {
      cargarTurnos(armadorSeleccionado);
    } else {
      setTurnos([]);
      setTurnoSeleccionado(null);
    }
  }, [armadorSeleccionado]);

  const cargarUsuario = async () => {
    try {
      const response = await fetch("/api/usuarios/perfil");
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      }
    } catch (error) {
      console.error("Error cargando usuario:", error);
    } finally {
      setLoading(false);
    }
  };

  const cargarArmadores = async () => {
    try {
      const response = await fetch("/api/armadores");
      if (response.ok) {
        const data = await response.json();
        const lista = Array.isArray(data) ? data : data.armadores || [];
        setArmadores(lista);
      }
    } catch (error) {
      console.error("Error cargando armadores:", error);
    }
  };

  const cargarTurnos = async (armadorId: string) => {
    setLoadingTurnos(true);
    setTurnos([]);
    setTurnoSeleccionado(null);
    try {
      const response = await fetch(`/api/armadores/${armadorId}/turnos?limit=20`);
      if (response.ok) {
        const data = await response.json();
        setTurnos(data.turnos || []);

        // Seleccionar el primer turno automáticamente
        if (data.turnos && data.turnos.length > 0) {
          setTurnoSeleccionado(data.turnos[0].id);
        }
      } else {
        console.error("Error en respuesta:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("Error cargando turnos:", error);
    } finally {
      setLoadingTurnos(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  const distanciaTotal = turno
    ? calcularDistanciaTotal(turno.rutaPuntos)
    : 0;

  const duracion = turno && turno.finTurno
    ? calcularDuracion(turno.inicioTurno, turno.finTurno)
    : "En curso";

  return (
    <>
      {user && <Navbar user={user} />}
      <div className="container mx-auto p-6">
        <EnhancedCard>
          <div className="p-6">
            <div className="flex items-center mb-6">
              <MapPin className="w-8 h-8 text-primary mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-foreground">Historial de Rutas</h1>
                <p className="text-sm text-muted-foreground">
                  Visualiza las rutas recorridas por los armadores
                </p>
              </div>
            </div>

            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <Label htmlFor="armador">Seleccionar Armador</Label>
                <select
                  id="armador"
                  value={armadorSeleccionado}
                  onChange={(e) => setArmadorSeleccionado(e.target.value)}
                  className="w-full mt-2 px-4 py-3 bg-slate-900 text-white border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="" className="bg-slate-900 text-white">-- Seleccione un armador --</option>
                  {armadores.map((armador) => (
                    <option key={armador.id} value={armador.id} className="bg-slate-900 text-white">
                      {armador.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="turno">Seleccionar Turno</Label>
                <select
                  id="turno"
                  value={turnoSeleccionado || ""}
                  onChange={(e) => setTurnoSeleccionado(e.target.value || null)}
                  className="w-full mt-2 px-4 py-3 bg-slate-900 text-white border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  disabled={!armadorSeleccionado || loadingTurnos}
                >
                  <option value="" className="bg-slate-900 text-white">
                    {loadingTurnos
                      ? "Cargando turnos..."
                      : !armadorSeleccionado
                      ? "-- Primero seleccione un armador --"
                      : turnos.length === 0
                      ? "-- No hay turnos disponibles --"
                      : "-- Seleccione un turno --"}
                  </option>
                  {turnos.map((turno) => (
                    <option key={turno.id} value={turno.id} className="bg-slate-900 text-white">
                      {new Date(turno.inicioTurno).toLocaleString()} - {turno.estado}
                    </option>
                  ))}
                </select>
                {armadorSeleccionado && !loadingTurnos && turnos.length === 0 && (
                  <p className="text-sm text-amber-600 mt-2">
                    Este armador no tiene turnos registrados aún.
                  </p>
                )}
              </div>
            </div>

            {/* Estadísticas */}
            {turno && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-muted/30 p-4 rounded-lg">
                  <div className="flex items-center text-sm text-muted-foreground mb-1">
                    <UserIcon className="w-4 h-4 mr-2" />
                    Armador
                  </div>
                  <div className="text-lg font-semibold">{turno.armador.usuario.nombre}</div>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg">
                  <div className="flex items-center text-sm text-muted-foreground mb-1">
                    <Route className="w-4 h-4 mr-2" />
                    Distancia
                  </div>
                  <div className="text-lg font-semibold">{formatearDistancia(distanciaTotal)}</div>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg">
                  <div className="flex items-center text-sm text-muted-foreground mb-1">
                    <Clock className="w-4 h-4 mr-2" />
                    Duración
                  </div>
                  <div className="text-lg font-semibold">{duracion}</div>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg">
                  <div className="flex items-center text-sm text-muted-foreground mb-1">
                    <MapPin className="w-4 h-4 mr-2" />
                    Puntos
                  </div>
                  <div className="text-lg font-semibold">{turno.rutaPuntos.length}</div>
                </div>
              </div>
            )}

            {/* Mapa */}
            <div className="border rounded-lg overflow-hidden" style={{ height: "600px" }}>
              {loadingRuta ? (
                <div className="flex items-center justify-center h-full bg-slate-900/50">
                  <Loader2 className="w-12 h-12 animate-spin text-primary" />
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-full bg-slate-900/50">
                  <p className="text-red-500">{error}</p>
                </div>
              ) : turno ? (
                <MapaRutaArmador puntos={turno.rutaPuntos} className="h-full" />
              ) : (
                <div className="flex items-center justify-center h-full bg-slate-900/50">
                  <p className="text-slate-400">Selecciona un armador y turno para ver la ruta</p>
                </div>
              )}
            </div>

            {/* Análisis de paradas y desvíos de ruta */}
            {turno && (turno.analisis || turno.ordenesAnalizadas) && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-muted/20 rounded-lg p-4">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <PauseCircle className="w-4 h-4" />
                    Paradas detectadas
                  </h3>
                  {turno.analisis && turno.analisis.paradas.length > 0 ? (
                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {turno.analisis.paradas.map((parada, idx) => (
                        <div key={idx} className="text-sm bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <div className="font-medium text-amber-900">
                            Detenido {Math.round(parada.duracionMinutos)} min
                          </div>
                          <div className="text-amber-700 text-xs">
                            {new Date(parada.inicio).toLocaleTimeString()} - {new Date(parada.fin).toLocaleTimeString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No se detectaron paradas prolongadas en este turno.</p>
                  )}
                </div>

                <div className="bg-muted/20 rounded-lg p-4">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Route className="w-4 h-4" />
                    Cumplimiento de ruta por orden
                  </h3>
                  {turno.ordenesAnalizadas && turno.ordenesAnalizadas.length > 0 ? (
                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {turno.ordenesAnalizadas.map((orden) => (
                        <div
                          key={orden.ordenId}
                          className={`text-sm rounded-lg p-3 border ${
                            orden.seDesvio
                              ? "bg-amber-50 border-amber-200"
                              : "bg-emerald-50 border-emerald-200"
                          }`}
                        >
                          <div className={`font-medium flex items-center gap-1 ${
                            orden.seDesvio ? "text-amber-900" : "text-emerald-900"
                          }`}>
                            {orden.seDesvio ? (
                              <AlertTriangle className="w-3.5 h-3.5" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            #{orden.codigo} - {orden.cliente}
                          </div>
                          <div className={orden.seDesvio ? "text-amber-700 text-xs" : "text-emerald-700 text-xs"}>
                            {orden.seDesvio
                              ? `Se desvió: ${orden.puntosFueraDeRuta}/${orden.puntosTotales} puntos GPS a más de ${orden.radioDesvioMetros} m de la ruta sugerida (máx. ${orden.distanciaMaximaDesvioMetros} m)`
                              : `Siguió la ruta sugerida (desvío máximo ${orden.distanciaMaximaDesvioMetros} m)`}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No hay órdenes con ruta analizada en este turno.</p>
                  )}
                </div>
              </div>
            )}

            {/* Lista de puntos */}
            {turno && turno.rutaPuntos.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Puntos de Ruta</h3>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {turno.rutaPuntos.map((punto, index: number) => (
                    <div
                      key={punto.id}
                      className="flex items-center justify-between p-3 bg-muted/20 rounded-lg"
                    >
                      <div className="flex items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3 ${
                            punto.tipo === "INICIO"
                              ? "bg-green-500"
                              : punto.tipo === "FIN"
                              ? "bg-red-500"
                              : punto.tipo === "PARADA"
                              ? "bg-orange-500"
                              : "bg-gray-500"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{punto.descripcion || punto.tipo}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(punto.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {punto.latitud.toFixed(6)}, {punto.longitud.toFixed(6)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </EnhancedCard>
      </div>
    </>
  );
}
