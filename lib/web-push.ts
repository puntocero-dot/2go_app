/**
 * Web Push API — Envío de notificaciones push a dispositivos suscritos.
 *
 * Usa VAPID (Voluntary Application Server Identification) para autenticar
 * el servidor ante los servicios de push del navegador.
 *
 * Configuración requerida en .env:
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
 *   VAPID_PRIVATE_KEY=...
 *   VAPID_EMAIL=mailto:admin@2go.app
 *
 * Para generar las keys:
 *   node -e "const wp = require('web-push'); console.log(wp.generateVAPIDKeys())"
 */

import webpush from "web-push";
import { prisma } from "@/lib/prisma";

// Configurar VAPID una sola vez
if (
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
  process.env.VAPID_PRIVATE_KEY
) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL || "mailto:admin@armados2go.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

/**
 * Envía una notificación push a todos los dispositivos suscritos de un usuario.
 * Elimina suscripciones inválidas automáticamente.
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<void> {
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return; // VAPID no configurado
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length === 0) return;

  const notification = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || "/icon-192.png",
    badge: payload.badge || "/icon-192.png",
    url: payload.url || "/",
    tag: payload.tag,
  });

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          notification
        );
      } catch (err: unknown) {
        // 410 Gone = suscripción expirada, eliminar
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 410 || statusCode === 404) {
          await prisma.pushSubscription
            .delete({ where: { id: sub.id } })
            .catch(() => {});
        }
        throw err;
      }
    })
  );

  // Log silencioso de errores
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      console.warn(`[web-push] Failed for subscription ${subscriptions[i].id}:`, r.reason);
    }
  });
}

/**
 * Envía notificación push a múltiples usuarios.
 */
export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload
): Promise<void> {
  await Promise.allSettled(userIds.map((id) => sendPushToUser(id, payload)));
}

/**
 * Retorna la clave pública VAPID para el cliente.
 */
export function getVapidPublicKey(): string | undefined {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
}
