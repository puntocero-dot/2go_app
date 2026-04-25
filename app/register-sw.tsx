"use client";

import { useEffect } from "react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const PUSH_ENABLED = process.env.NEXT_PUBLIC_FF_PUSH_NOTIFICATIONS === "true";

/**
 * Convierte una clave VAPID base64 a Uint8Array para la Web Push API.
 */
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const arr = Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
  return arr.buffer;
}

/**
 * Suscribe al usuario actual a notificaciones push y guarda en DB.
 * Solo se ejecuta si el usuario ya está autenticado (no en /login).
 */
async function subscribeToPush(
  registration: ServiceWorkerRegistration
): Promise<void> {
  if (!VAPID_PUBLIC_KEY) return;

  // No intentar suscribir en páginas públicas (ej. /login)
  if (
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/login")
  ) {
    return;
  }

  try {
    // Verificar si ya hay suscripción activa
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      // Ya suscrito, asegurarse de que está registrado en DB
      await savePushSubscription(existing);
      return;
    }

    // Solicitar permiso si no ha sido concedido aún
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    // Crear nueva suscripción
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    await savePushSubscription(subscription);
  } catch {
    // Silencioso — no bloquear la app si push falla
  }
}

async function savePushSubscription(
  subscription: PushSubscription
): Promise<void> {
  const key = subscription.getKey("p256dh");
  const auth = subscription.getKey("auth");

  if (!key || !auth) return;

  const p256dh = btoa(String.fromCharCode(...new Uint8Array(key)));
  const authStr = btoa(String.fromCharCode(...new Uint8Array(auth)));

  try {
    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        p256dh,
        auth: authStr,
      }),
    });

    // 401 = sesión no activa todavía; ignorar sin ruido
    if (!res.ok && res.status !== 401) {
      console.warn("[Push] Error al guardar suscripción:", res.status);
    }
  } catch {
    // No bloquear la app si push falla
  }
}

export function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("[SW] Registrado:", registration.scope);

        // Activar push notifications si el flag está habilitado
        if (PUSH_ENABLED && "PushManager" in window) {
          // Esperar a que el SW esté activo antes de suscribir
          if (registration.active) {
            subscribeToPush(registration);
          } else {
            registration.addEventListener("updatefound", () => {
              const newWorker = registration.installing;
              newWorker?.addEventListener("statechange", () => {
                if (newWorker.state === "activated") {
                  subscribeToPush(registration);
                }
              });
            });
          }
        }
      })
      .catch((error) => {
        console.error("[SW] Error al registrar:", error);
      });
  }, []);

  return null;
}
