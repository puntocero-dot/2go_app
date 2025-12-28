"use client";

import { useEffect } from "react";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";

export function ArmadorGpsTracker() {
  const trackingEnabled = useFeatureFlag('TRACKING_AUTO');

  useEffect(() => {
    // Si el feature flag está deshabilitado, no iniciar tracking
    if (!trackingEnabled) {
      return;
    }

    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      return;
    }

    let cancelled = false;
    let watchId: number | null = null;
    let lastSentTime = 0;
    let lastPosition: { lat: number; lng: number } | null = null;

    // Configuración dinámica basada en velocidad
    const getIntervalBySpeed = (speed: number | null): number => {
      if (!speed || speed < 0.5) {
        // Quieto o muy lento (< 1.8 km/h): cada 5 minutos
        return 5 * 60 * 1000;
      } else if (speed < 5) {
        // Caminando (< 18 km/h): cada 2 minutos
        return 2 * 60 * 1000;
      } else if (speed < 15) {
        // Velocidad media (< 54 km/h): cada 1 minuto
        return 60 * 1000;
      } else {
        // Alta velocidad (>= 54 km/h): cada 30 segundos
        return 30 * 1000;
      }
    };

    const calculateDistance = (
      lat1: number,
      lng1: number,
      lat2: number,
      lng2: number
    ): number => {
      // Fórmula de Haversine para calcular distancia en metros
      const R = 6371e3; // Radio de la Tierra en metros
      const φ1 = (lat1 * Math.PI) / 180;
      const φ2 = (lat2 * Math.PI) / 180;
      const Δφ = ((lat2 - lat1) * Math.PI) / 180;
      const Δλ = ((lng2 - lng1) * Math.PI) / 180;

      const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      return R * c;
    };

    const sendLocation = (lat: number, lng: number, speed: number | null) => {
      if (cancelled) return;

      const now = Date.now();
      const timeSinceLastSent = now - lastSentTime;
      const requiredInterval = getIntervalBySpeed(speed);

      // Verificar si ha pasado suficiente tiempo según la velocidad
      if (timeSinceLastSent < requiredInterval) {
        return;
      }

      // Verificar si se ha movido significativamente (más de 10 metros)
      if (lastPosition) {
        const distance = calculateDistance(
          lastPosition.lat,
          lastPosition.lng,
          lat,
          lng
        );

        // Si no se ha movido más de 10 metros y no ha pasado el intervalo completo, no enviar
        if (distance < 10 && timeSinceLastSent < requiredInterval) {
          return;
        }
      }

      // Enviar ubicación
      fetch("/api/armadores/ubicacion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lat, lng }),
      })
        .then(() => {
          lastSentTime = now;
          lastPosition = { lat, lng };
        })
        .catch((error) => {
          console.error("Error enviando ubicación del armador:", error);
        });
    };

    // Usar watchPosition para eventos de cambio de posición
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (cancelled) return;

        const { latitude, longitude, speed, accuracy } = pos.coords;
        
        // Filtrar lecturas con baja precisión (más de 100 metros de error)
        if (accuracy && accuracy > 100) {
          console.warn(`GPS con baja precisión: ${accuracy.toFixed(0)}m - ignorando lectura`);
          return;
        }

        // Validar saltos drásticos (más de 5km desde última posición)
        if (lastPosition) {
          const distance = calculateDistance(
            lastPosition.lat,
            lastPosition.lng,
            latitude,
            longitude
          );
          
          if (distance > 5000) {
            console.warn(`Salto GPS detectado: ${(distance/1000).toFixed(1)}km - ignorando lectura`);
            return;
          }
        }
        
        // speed viene en m/s, null si no está disponible
        sendLocation(latitude, longitude, speed);
      },
      (error) => {
        console.warn("Error obteniendo ubicación del armador:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0, // Siempre obtener posición fresca
      }
    );

    return () => {
      cancelled = true;
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [trackingEnabled]);

  return null;
}
