"use client";

/**
 * Hook para consumir un SSE endpoint con reconexión automática.
 *
 * Uso:
 *   const { estado, connected } = useEventStream(ordenId, token);
 *
 * Reconexión: exponential backoff 1s → 2s → 4s → 8s (máx).
 * Se desconecta automáticamente al desmontar el componente.
 */

import { useEffect, useRef, useState } from "react";

interface EventStreamOptions {
  enabled?: boolean;
  onEstadoChange?: (estado: string) => void;
  onUbicacionChange?: (ubicacion: { lat: number; lng: number }) => void;
}

interface EventStreamState {
  estado: string | null;
  connected: boolean;
  error: boolean;
  ubicacion: { lat: number; lng: number } | null;
}

export function useEventStream(
  ordenId: string,
  token: string | null,
  options: EventStreamOptions = {}
): EventStreamState {
  const { enabled = true, onEstadoChange, onUbicacionChange } = options;
  const [state, setState] = useState<EventStreamState>({
    estado: null,
    connected: false,
    error: false,
    ubicacion: null,
  });

  const esRef = useRef<EventSource | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryDelay = useRef(1000);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    if (!enabled || !token || !ordenId) return;

    function connect() {
      if (!mountedRef.current) return;

      const url = `/api/events/${ordenId}?token=${encodeURIComponent(token!)}`;
      const es = new EventSource(url);
      esRef.current = es;

      es.addEventListener("connected", () => {
        if (!mountedRef.current) return;
        retryDelay.current = 1000; // reset backoff
        setState((prev) => ({ ...prev, connected: true, error: false }));
      });

      es.addEventListener("estado", (e: MessageEvent) => {
        if (!mountedRef.current) return;
        try {
          const data = JSON.parse(e.data) as { estado: string };
          setState((prev) => ({ ...prev, estado: data.estado }));
          onEstadoChange?.(data.estado);
        } catch {
          // Ignorar parse errors
        }
      });

      es.addEventListener("ubicacion", (e: MessageEvent) => {
        if (!mountedRef.current) return;
        try {
          const data = JSON.parse(e.data) as { lat: number; lng: number };
          setState((prev) => ({ ...prev, ubicacion: { lat: data.lat, lng: data.lng } }));
          onUbicacionChange?.({ lat: data.lat, lng: data.lng });
        } catch {
          // Ignore parse errors
        }
      });

      es.addEventListener("timeout", () => {
        // El servidor cerró la conexión (límite de 55s) — reconectar inmediatamente
        es.close();
        if (mountedRef.current) {
          retryDelay.current = 0;
          scheduleReconnect();
        }
      });

      es.onerror = () => {
        es.close();
        if (!mountedRef.current) return;
        setState((prev) => ({ ...prev, connected: false, error: true }));
        scheduleReconnect();
      };
    }

    function scheduleReconnect() {
      if (!mountedRef.current) return;
      retryRef.current = setTimeout(() => {
        retryDelay.current = Math.min(retryDelay.current * 2, 8000);
        connect();
      }, retryDelay.current);
    }

    connect();

    return () => {
      mountedRef.current = false;
      esRef.current?.close();
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, [ordenId, token, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  return state;
}
