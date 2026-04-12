/**
 * Cache en memoria para ETAs calculados via Mapbox Directions API.
 * Evita llamadas redundantes cuando multiples clientes pollan la misma orden
 * o cuando el GPS del armador no se ha actualizado entre polls.
 *
 * TTL: 25 segundos (menor que el polling de 30s del cliente).
 */

export interface EtaCacheEntry {
  lastGpsTimestamp: Date;
  etaSeconds: number;
  distanceMeters: number;
  calculatedAt: Date;
}

const cache = new Map<string, EtaCacheEntry>();
const TTL_MS = 25_000; // 25 segundos

/**
 * Obtiene la entrada cacheada si existe y no ha expirado.
 * Retorna null si no hay cache valido.
 */
export function getEtaCache(ordenId: string): EtaCacheEntry | null {
  const entry = cache.get(ordenId);
  if (!entry) return null;

  const age = Date.now() - entry.calculatedAt.getTime();
  if (age > TTL_MS) {
    cache.delete(ordenId);
    return null;
  }

  return entry;
}

/**
 * Almacena un ETA calculado en cache.
 */
export function setEtaCache(ordenId: string, data: Omit<EtaCacheEntry, "calculatedAt">): void {
  cache.set(ordenId, {
    ...data,
    calculatedAt: new Date(),
  });
}

/**
 * Invalida el cache de una orden especifica.
 * Llamado cuando llega un nuevo punto GPS del armador.
 */
export function invalidateEta(ordenId: string): void {
  cache.delete(ordenId);
}

/**
 * Invalida todas las entradas del cache.
 * Util para testing o limpieza general.
 */
export function invalidateAllEta(): void {
  cache.clear();
}

// Limpieza periodica de entradas expiradas (cada 60 segundos)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - entry.calculatedAt.getTime() > TTL_MS) {
      cache.delete(key);
    }
  }
}, 60_000);
