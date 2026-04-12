/**
 * Publisher de eventos en tiempo real via Redis.
 *
 * Estrategia: Upstash Redis REST no soporta PubSub clásico.
 * En su lugar, escribimos el estado en una Redis key con TTL corto.
 * El SSE endpoint lee esta key cada 2s y envía eventos al cliente
 * cuando detecta un cambio — mucho más eficiente que polling a PostgreSQL.
 *
 * Keys:
 *   order-state:{ordenId}  → { estado, updatedAt } con TTL 10 min
 */

import { Redis } from "@upstash/redis";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const ORDER_STATE_TTL = 600; // 10 minutos

export interface OrderStateEvent {
  ordenId: string;
  estado: string;
  updatedAt: string;
}

/**
 * Publica un cambio de estado de orden en Redis.
 * Llamar después de actualizar la orden en DB.
 */
export async function publishOrderUpdate(
  ordenId: string,
  estado: string
): Promise<void> {
  if (!redis) return;

  const payload: OrderStateEvent = {
    ordenId,
    estado,
    updatedAt: new Date().toISOString(),
  };

  try {
    await redis.set(`order-state:${ordenId}`, JSON.stringify(payload), {
      ex: ORDER_STATE_TTL,
    });
  } catch {
    // No bloquear si Redis falla
  }
}

/**
 * Lee el estado actual de una orden desde Redis.
 * Retorna null si no hay evento reciente.
 */
export async function readOrderState(
  ordenId: string
): Promise<OrderStateEvent | null> {
  if (!redis) return null;

  try {
    const raw = await redis.get<string>(`order-state:${ordenId}`);
    if (!raw) return null;
    return typeof raw === "string" ? JSON.parse(raw) : (raw as OrderStateEvent);
  } catch {
    return null;
  }
}

/**
 * Verifica si el publisher tiene Redis disponible.
 */
export function isRealtimeAvailable(): boolean {
  return redis !== null;
}
