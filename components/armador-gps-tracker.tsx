"use client";

import { useEffect } from "react";

export function ArmadorGpsTracker() {
  useEffect(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      return;
    }

    let cancelled = false;

    const sendLocation = (lat: number, lng: number) => {
      if (cancelled) return;

      fetch("/api/armadores/ubicacion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lat, lng }),
      }).catch((error) => {
        console.error("Error enviando ubicación del armador:", error);
      });
    };

    const updateLocation = () => {
      if (cancelled) return;

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          sendLocation(latitude, longitude);
        },
        (error) => {
          console.warn("No se pudo obtener la ubicación del armador:", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 15000,
        },
      );
    };

    // Enviar ubicación al cargar y luego cada 30 segundos
    updateLocation();
    const intervalId = window.setInterval(updateLocation, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  return null;
}
