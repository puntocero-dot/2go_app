"use client";

import { useEffect } from "react";

export function RegisterServiceWorker() {
  useEffect(() => {
    // Temporalmente desactivado para diagnosticar error de Server Component
    console.log("Service Worker desactivado temporalmente para diagnóstico");
    
    // if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    //   navigator.serviceWorker
    //     .register("/sw.js")
    //     .then((registration) => {
    //       console.log("Service Worker registrado:", registration);
    //     })
    //     .catch((error) => {
    //       console.error("Error al registrar Service Worker:", error);
    //     });
    // }
  }, []);

  return null;
}
