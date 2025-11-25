import { useState, useEffect } from "react";

interface RutaPunto {
  id: string;
  latitud: number;
  longitud: number;
  timestamp: string;
  tipo: "INICIO" | "INTERMEDIO" | "PARADA" | "FIN";
  descripcion?: string;
}

interface Turno {
  id: string;
  inicioTurno: string;
  finTurno?: string;
  estado: "ACTIVO" | "PAUSADO" | "FINALIZADO" | "CANCELADO";
  rutaPuntos: RutaPunto[];
  armador: {
    usuario: {
      nombre: string;
      email: string;
    };
  };
}

interface UseRutaTurnoReturn {
  turno: Turno | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useRutaTurno(turnoId: string | null): UseRutaTurnoReturn {
  const [turno, setTurno] = useState<Turno | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRuta = async () => {
    if (!turnoId) {
      setTurno(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/turnos/${turnoId}/ruta`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al cargar la ruta");
      }

      const data = await response.json();
      setTurno(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setTurno(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuta();
  }, [turnoId]);

  return {
    turno,
    loading,
    error,
    refetch: fetchRuta,
  };
}
