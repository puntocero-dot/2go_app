"use client";

import { useState, useEffect, useRef } from "react";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { Play, Square, MapPin, Loader2 } from "lucide-react";
import { obtenerUbicacion } from "@/lib/geolocation";

interface TrackingAutomaticoProps {
  onTurnoIniciado?: (turnoId: string) => void;
  onTurnoFinalizado?: () => void;
}

export function TrackingAutomatico({
  onTurnoIniciado,
  onTurnoFinalizado,
}: TrackingAutomaticoProps) {
  const [turnoActivo, setTurnoActivo] = useState<string | null>(null);
  const [tracking, setTracking] = useState(false);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Verificar si hay un turno activo al cargar
  useEffect(() => {
    verificarTurnoActivo();
  }, []);

  // Limpiar intervalo al desmontar
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const verificarTurnoActivo = async () => {
    try {
      const response = await fetch("/api/turnos/activo");
      if (response.ok) {
        const data = await response.json();
        if (data.turno) {
          setTurnoActivo(data.turno.id);
          iniciarTracking(data.turno.id);
        }
      }
    } catch (error) {
      console.error("Error verificando turno activo:", error);
    }
  };

  const iniciarTurno = async () => {
    setLoading(true);
    try {
      // Obtener ubicación actual
      const ubicacion = await obtenerUbicacion();

      // Iniciar turno
      const response = await fetch("/api/turnos/iniciar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitud: ubicacion.latitud,
          longitud: ubicacion.longitud,
          descripcion: "Inicio de turno",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al iniciar turno");
      }

      const data = await response.json();
      setTurnoActivo(data.id);
      iniciarTracking(data.id);

      if (onTurnoIniciado) {
        onTurnoIniciado(data.id);
      }

      alert("✅ Turno iniciado correctamente");
    } catch (error) {
      console.error("Error iniciando turno:", error);
      alert("❌ " + (error instanceof Error ? error.message : "Error al iniciar turno"));
    } finally {
      setLoading(false);
    }
  };

  const iniciarTracking = (turnoId: string) => {
    setTracking(true);

    // Enviar ubicación cada 60 segundos
    intervalRef.current = setInterval(async () => {
      try {
        const ubicacion = await obtenerUbicacion();

        await fetch(`/api/turnos/${turnoId}/ubicacion`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            latitud: ubicacion.latitud,
            longitud: ubicacion.longitud,
          }),
        });
      } catch (error) {
        console.error("Error enviando ubicación:", error);
      }
    }, 60000); // 60 segundos
  };

  const finalizarTurno = async () => {
    if (!turnoActivo) return;

    setLoading(true);
    try {
      // Obtener ubicación actual
      const ubicacion = await obtenerUbicacion();

      // Finalizar turno
      const response = await fetch(`/api/turnos/${turnoActivo}/finalizar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitud: ubicacion.latitud,
          longitud: ubicacion.longitud,
          descripcion: "Fin de turno",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al finalizar turno");
      }

      // Detener tracking
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      setTurnoActivo(null);
      setTracking(false);

      if (onTurnoFinalizado) {
        onTurnoFinalizado();
      }

      alert("✅ Turno finalizado correctamente");
    } catch (error) {
      console.error("Error finalizando turno:", error);
      alert("❌ " + (error instanceof Error ? error.message : "Error al finalizar turno"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-4">
      {!turnoActivo ? (
        <EnhancedButton onClick={iniciarTurno} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Iniciando...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Iniciar Turno
            </>
          )}
        </EnhancedButton>
      ) : (
        <>
          <div className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg">
            <MapPin className="w-4 h-4 animate-pulse" />
            <span className="text-sm font-medium">Tracking Activo</span>
          </div>
          <EnhancedButton variant="destructive" onClick={finalizarTurno} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Finalizando...
              </>
            ) : (
              <>
                <Square className="w-4 h-4 mr-2" />
                Finalizar Turno
              </>
            )}
          </EnhancedButton>
        </>
      )}
    </div>
  );
}
