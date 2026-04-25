"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { Loader2, Clock, MapPin, Users, AlertCircle, Calendar, Activity } from "lucide-react";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { TurnosCalendario } from "@/components/turnos-calendario";

interface TurnoActivo {
  id: string;
  armadorId: string;
  armadorNombre: string;
  armadorTelefono: string;
  estadoLoggeo: string;
  inicioTurno: string;
  duracionMinutos: number;
  ordenesActivas: number;
  ordenes: Array<{
    id: string;
    codigoReferenciaRetail: string;
    estado: string;
  }>;
  ubicacionActual: {
    lat: number;
    lng: number;
    timestamp: string;
  } | null;
  totalPuntosRuta: number;
}

interface ArmadorSinTurno {
  id: string;
  nombre: string;
  telefono: string;
  estadoLoggeo: string;
}

interface Resumen {
  totalTurnosActivos: number;
  totalArmadoresActivos: number;
  armadoresSinTurno: number;
}

export default function TurnosActivosPage() {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [turnos, setTurnos] = useState<TurnoActivo[]>([]);
  const [armadoresSinTurno, setArmadoresSinTurno] = useState<ArmadorSinTurno[]>([]);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [popupInfo, setPopupInfo] = useState<TurnoActivo | null>(null);
  const [viewMode, setViewMode] = useState<"realtime" | "calendar">("realtime");
  const [armadores, setArmadores] = useState<{ id: string; nombre: string }[]>([]);
  const [viewState, setViewState] = useState({
    longitude: -89.2182,
    latitude: 13.6929,
    zoom: 11,
  });

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  useEffect(() => {
    cargarUsuario();
    cargarTurnos();
    cargarArmadores();

    // Actualizar cada 30 segundos
    const interval = setInterval(cargarTurnos, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarArmadores = async () => {
    try {
      const response = await fetch("/api/armadores");
      if (response.ok) {
        const data = await response.json();
        const armadoresList = data.armadores || data || [];
        setArmadores(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          armadoresList.map((a: any) => ({
            id: a.id,
            nombre: a.usuario?.nombre || a.nombre || "Sin nombre",
          }))
        );
      }
    } catch (error) {
      console.error("Error cargando armadores:", error);
    }
  };

  const cargarUsuario = async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (!response.ok) {
        router.push("/login");
        return;
      }

      const data = await response.json();
      const usuario = data?.user ?? data;

      if (!usuario || !["ADMIN", "SUPERVISOR"].includes(usuario.rol)) {
        router.push("/login");
        return;
      }

      setUser(usuario);
    } catch (error) {
      console.error("Error cargando usuario:", error);
    }
  };

  const cargarTurnos = async () => {
    try {
      const response = await fetch("/api/turnos/activos");
      if (!response.ok) throw new Error("Error al cargar turnos activos");

      const data = await response.json();
      setTurnos(data.turnosActivos || []);
      setArmadoresSinTurno(data.armadoresSinTurno || []);
      setResumen(data.resumen);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatearDuracion = (minutos: number) => {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      {user && <Navbar user={user} />}
      <div className="container mx-auto p-6">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Clock className="w-8 h-8" />
              Gestión de Turnos
            </h1>
            <p className="text-gray-600 mt-2">
              {viewMode === "realtime"
                ? "Monitoreo en tiempo real de armadores trabajando"
                : "Horarios programados vs conexiones reales"}
            </p>
          </div>

          {/* Toggle de vista */}
          <div className="flex gap-2">
            <EnhancedButton
              variant={viewMode === "realtime" ? "default" : "outline"}
              onClick={() => setViewMode("realtime")}
            >
              <Activity className="w-4 h-4 mr-2" />
              Tiempo Real
            </EnhancedButton>
            <EnhancedButton
              variant={viewMode === "calendar" ? "default" : "outline"}
              onClick={() => setViewMode("calendar")}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Calendario
            </EnhancedButton>
          </div>
        </div>

        {/* Vista de Calendario */}
        {viewMode === "calendar" && (
          <TurnosCalendario armadores={armadores} />
        )}

        {/* Vista de Tiempo Real */}
        {viewMode === "realtime" && (
          <>
        {/* Resumen */}
        {resumen && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Turnos Activos</CardTitle>
                <Clock className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{resumen.totalTurnosActivos}</div>
                <p className="text-xs text-muted-foreground">Armadores trabajando</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Armadores</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{resumen.totalArmadoresActivos}</div>
                <p className="text-xs text-muted-foreground">Activos en el sistema</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sin Turno</CardTitle>
                <AlertCircle className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">{resumen.armadoresSinTurno}</div>
                <p className="text-xs text-muted-foreground">No han iniciado turno</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Mapa */}
        {mapboxToken ? (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Ubicación en Tiempo Real
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[500px] rounded-lg overflow-hidden">
                <Map
                  {...viewState}
                  onMove={(evt) => setViewState(evt.viewState)}
                  mapStyle="mapbox://styles/mapbox/streets-v12"
                  mapboxAccessToken={mapboxToken}
                >
                  <NavigationControl position="top-right" />

                  {turnos.map((turno) => {
                    if (!turno.ubicacionActual) return null;

                    return (
                      <Marker
                        key={turno.id}
                        longitude={turno.ubicacionActual.lng}
                        latitude={turno.ubicacionActual.lat}
                        onClick={(e) => {
                          e.originalEvent.stopPropagation();
                          setPopupInfo(turno);
                        }}
                      >
                        <div
                          className="cursor-pointer relative"
                          style={{
                            width: 30,
                            height: 30,
                            backgroundColor: "#22c55e",
                            borderRadius: "50%",
                            border: "3px solid white",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                          }}
                        >
                          <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                            A
                          </div>
                        </div>
                      </Marker>
                    );
                  })}

                  {popupInfo && popupInfo.ubicacionActual && (
                    <Popup
                      longitude={popupInfo.ubicacionActual.lng}
                      latitude={popupInfo.ubicacionActual.lat}
                      onClose={() => setPopupInfo(null)}
                      closeButton={true}
                      closeOnClick={false}
                    >
                      <div className="p-2">
                        <h3 className="font-bold text-sm mb-1">{popupInfo.armadorNombre}</h3>
                        <p className="text-xs text-gray-600">
                          Turno: {formatearDuracion(popupInfo.duracionMinutos)}
                        </p>
                        <p className="text-xs text-gray-600">
                          Órdenes: {popupInfo.ordenesActivas}
                        </p>
                        <p className="text-xs text-gray-600">
                          Puntos GPS: {popupInfo.totalPuntosRuta}
                        </p>
                      </div>
                    </Popup>
                  )}
                </Map>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Mapa no disponible. Configura NEXT_PUBLIC_MAPBOX_TOKEN</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de Turnos Activos */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Turnos en Curso</CardTitle>
          </CardHeader>
          <CardContent>
            {turnos.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No hay turnos activos en este momento</p>
              </div>
            ) : (
              <div className="space-y-4">
                {turnos.map((turno) => (
                  <div
                    key={turno.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{turno.armadorNombre}</h3>
                          <Badge
                            variant={turno.estadoLoggeo === "ONLINE" ? "default" : "secondary"}
                            className={
                              turno.estadoLoggeo === "ONLINE"
                                ? "bg-green-600"
                                : "bg-gray-400"
                            }
                          >
                            {turno.estadoLoggeo}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Duración</p>
                            <p className="font-medium">{formatearDuracion(turno.duracionMinutos)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Órdenes Activas</p>
                            <p className="font-medium">{turno.ordenesActivas}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Puntos GPS</p>
                            <p className="font-medium">{turno.totalPuntosRuta}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Teléfono</p>
                            <p className="font-medium">{turno.armadorTelefono || "N/A"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Armadores Sin Turno */}
        {armadoresSinTurno.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="w-5 h-5" />
                Armadores Sin Turno Activo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {armadoresSinTurno.map((armador) => (
                  <div
                    key={armador.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-amber-50"
                  >
                    <div>
                      <p className="font-medium">{armador.nombre}</p>
                      <p className="text-sm text-gray-600">{armador.telefono || "Sin teléfono"}</p>
                    </div>
                    <Badge variant="outline" className="border-amber-600 text-amber-600">
                      {armador.estadoLoggeo}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
          </>
        )}
      </div>
    </>
  );
}
