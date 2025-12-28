"use client";

import { useEffect, useRef, useCallback } from "react";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { retryWithBackoff } from "@/lib/retry";

interface QueuedPoint {
  lat: number;
  lng: number;
  timestamp: number;
}

const QUEUE_STORAGE_KEY = 'gps_queued_points';
const MAX_QUEUE_SIZE = 100;

export function ArmadorGpsTracker() {
  const trackingEnabled = useFeatureFlag('TRACKING_AUTO');
  const watchIdRef = useRef<number | null>(null);
  const lastSentTimeRef = useRef<number>(0);
  const lastPositionRef = useRef<{ lat: number; lng: number } | null>(null);
  const failedAttemptsRef = useRef<number>(0);
  const isSyncingRef = useRef<boolean>(false);

  // Cargar cola desde localStorage
  const loadQueue = useCallback((): QueuedPoint[] => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, []);

  // Guardar cola en localStorage
  const saveQueue = useCallback((queue: QueuedPoint[]) => {
    if (typeof window === 'undefined') return;
    try {
      // Limitar tamaño de cola
      const trimmed = queue.slice(-MAX_QUEUE_SIZE);
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(trimmed));
    } catch (e) {
      console.warn('[GPS] Error guardando cola:', e);
    }
  }, []);

  // Agregar punto a la cola
  const addToQueue = useCallback((lat: number, lng: number) => {
    const queue = loadQueue();
    queue.push({ lat, lng, timestamp: Date.now() });
    saveQueue(queue);
    console.log(`[GPS] Punto agregado a cola. Total: ${queue.length}`);
  }, [loadQueue, saveQueue]);

  // Sincronizar cola cuando hay conexión
  const syncQueue = useCallback(async () => {
    if (isSyncingRef.current) return;
    
    const queue = loadQueue();
    if (queue.length === 0) return;
    
    isSyncingRef.current = true;
    console.log(`[GPS] Sincronizando ${queue.length} puntos en cola...`);
    
    const successfullySync: number[] = [];
    
    for (let i = 0; i < queue.length; i++) {
      const point = queue[i];
      try {
        const response = await fetch("/api/armadores/ubicacion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat: point.lat, lng: point.lng }),
        });
        
        if (response.ok) {
          successfullySync.push(i);
        } else {
          break; // Detener si falla
        }
      } catch {
        break; // Detener si falla
      }
    }
    
    if (successfullySync.length > 0) {
      const remaining = queue.filter((_, i) => !successfullySync.includes(i));
      saveQueue(remaining);
      console.log(`[GPS] Sincronizados ${successfullySync.length} puntos. Restantes: ${remaining.length}`);
    }
    
    isSyncingRef.current = false;
  }, [loadQueue, saveQueue]);

  // Configuración dinámica basada en velocidad
  const getIntervalBySpeed = useCallback((speed: number | null): number => {
    if (!speed || speed < 0.5) {
      return 5 * 60 * 1000; // 5 min si quieto
    } else if (speed < 5) {
      return 2 * 60 * 1000; // 2 min caminando
    } else if (speed < 15) {
      return 60 * 1000; // 1 min velocidad media
    } else {
      return 30 * 1000; // 30s alta velocidad
    }
  }, []);

  // Calcular distancia Haversine
  const calculateDistance = useCallback((
    lat1: number, lng1: number, lat2: number, lng2: number
  ): number => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }, []);

  // Enviar ubicación con retry
  const sendLocationWithRetry = useCallback(async (lat: number, lng: number) => {
    try {
      await retryWithBackoff(
        async () => {
          const response = await fetch("/api/armadores/ubicacion", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat, lng }),
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          
          return response;
        },
        {
          maxRetries: 3,
          initialDelay: 1000,
          maxDelay: 5000,
          onRetry: (attempt) => {
            console.warn(`[GPS] Reintento ${attempt} enviando ubicación`);
          }
        }
      );
      
      // Éxito
      lastSentTimeRef.current = Date.now();
      lastPositionRef.current = { lat, lng };
      failedAttemptsRef.current = 0;
      
      // Intentar sincronizar cola si hay puntos pendientes
      syncQueue();
      
    } catch (error) {
      console.error("[GPS] Error enviando ubicación después de reintentos:", error);
      failedAttemptsRef.current++;
      
      // Agregar a cola local para sincronizar después
      addToQueue(lat, lng);
    }
  }, [addToQueue, syncQueue]);

  // Manejar nueva posición
  const handlePosition = useCallback((pos: GeolocationPosition) => {
    const { latitude, longitude, speed, accuracy } = pos.coords;
    const now = Date.now();
    
    // Filtrar lecturas con baja precisión (>100m)
    if (accuracy && accuracy > 100) {
      console.warn(`[GPS] Baja precisión: ${accuracy.toFixed(0)}m - ignorando`);
      return;
    }
    
    // Validar saltos drásticos (>5km)
    if (lastPositionRef.current) {
      const distance = calculateDistance(
        lastPositionRef.current.lat,
        lastPositionRef.current.lng,
        latitude,
        longitude
      );
      
      if (distance > 5000) {
        console.warn(`[GPS] Salto detectado: ${(distance/1000).toFixed(1)}km - ignorando`);
        return;
      }
    }
    
    // Verificar intervalo según velocidad
    const timeSinceLastSent = now - lastSentTimeRef.current;
    const requiredInterval = getIntervalBySpeed(speed);
    
    if (timeSinceLastSent < requiredInterval) {
      return;
    }
    
    // Verificar movimiento mínimo (10m)
    if (lastPositionRef.current) {
      const distance = calculateDistance(
        lastPositionRef.current.lat,
        lastPositionRef.current.lng,
        latitude,
        longitude
      );
      
      if (distance < 10 && timeSinceLastSent < requiredInterval) {
        return;
      }
    }
    
    // Enviar con retry
    sendLocationWithRetry(latitude, longitude);
  }, [calculateDistance, getIntervalBySpeed, sendLocationWithRetry]);

  // Manejar error GPS
  const handleError = useCallback((error: GeolocationPositionError) => {
    const errorMessages: Record<number, string> = {
      1: 'Permisos GPS denegados',
      2: 'Posición no disponible',
      3: 'Timeout obteniendo posición'
    };
    console.warn(`[GPS] Error: ${errorMessages[error.code] || error.message}`);
  }, []);

  useEffect(() => {
    if (!trackingEnabled) return;
    if (typeof window === "undefined" || !("geolocation" in navigator)) return;

    // Listener para sincronizar cuando vuelve la conexión
    const handleOnline = () => {
      console.log('[GPS] Conexión restablecida, sincronizando cola...');
      syncQueue();
    };
    
    window.addEventListener('online', handleOnline);

    // Iniciar watchPosition
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0,
      }
    );

    // Sincronizar cola al iniciar (por si quedaron puntos de sesión anterior)
    syncQueue();

    return () => {
      window.removeEventListener('online', handleOnline);
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [trackingEnabled, handlePosition, handleError, syncQueue]);

  return null;
}
