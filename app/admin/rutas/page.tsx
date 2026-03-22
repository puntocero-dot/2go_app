"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/navbar";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { Label } from "@/components/ui/label";
import { useRutaTurno } from "@/hooks/useRutaTurno";
import { calcularDistanciaTotal, formatearDistancia, calcularDuracion } from "@/lib/geolocation";
import { Loader2, MapPin, Clock, Route, User as UserIcon } from "lucide-react";

const MapaRutaArmador = dynamic(() => import("@/components/MapaRutaArmador").then(mod => ({ default: mod.MapaRutaArmador })), {
  loading: () => <div className="flex items-center justify-center h-full bg-gray-100"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>,
  ssr: false,
});

export default function RutasPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [armadores, setArmadores] = useState<any[]>([]);
  const [armadorSeleccionado, setArmadorSeleccionado] = useState<string>("");
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
        console.log("Turnos recibidos:", data);
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
                  className="w-full mt-2 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">-- Seleccione un armador --</option>
                  {armadores.map((armador) => (
                    <option key={armador.id} value={armador.id}>
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
                  className="w-full mt-2 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={!armadorSeleccionado || loadingTurnos}
                >
                  <option value="">
                    {loadingTurnos
                      ? "Cargando turnos..."
                      : !armadorSeleccionado
                      ? "-- Primero seleccione un armador --"
                      : turnos.length === 0
                      ? "-- No hay turnos disponibles --"
                      : "-- Seleccione un turno --"}
                  </option>
                  {turnos.map((turno) => (
                    <option key={turno.id} value={turno.id}>
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
                <div className="flex items-center justify-center h-full bg-gray-100">
                  <Loader2 className="w-12 h-12 animate-spin text-primary" />
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-full bg-gray-100">
                  <p className="text-red-500">{error}</p>
                </div>
              ) : turno ? (
                <MapaRutaArmador puntos={turno.rutaPuntos} className="h-full" />
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-100">
                  <p className="text-gray-500">Selecciona un armador y turno para ver la ruta</p>
                </div>
              )}
            </div>

            {/* Lista de puntos */}
            {turno && turno.rutaPuntos.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Puntos de Ruta</h3>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {turno.rutaPuntos.map((punto: any, index: number) => (
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
