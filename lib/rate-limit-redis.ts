import { Redis } from "@upstash/redis";

// Configuración para rate limiting con Redis (Upstash)
type RedisRateLimitConfig = {
  windowMs: number;
  maxRequests: number;
  keyPrefix?: string;
};

export type RedisRateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
};

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = redisUrl && redisToken
  ? new Redis({ url: redisUrl, token: redisToken })
  : null;

export async function checkRateLimitRedis(
  key: string,
  config: RedisRateLimitConfig
): Promise<RedisRateLimitResult> {
  // Si Redis no está configurado, dejamos que el caller use fallback in-memory
  if (!redis) {
    return {
      ok: true,
      remaining: config.maxRequests,
      resetAt: Date.now() + config.windowMs,
    };
  }

  try {
    const now = Date.now();
    const windowStart = now - config.windowMs;
    const keyPrefix = config.keyPrefix ?? "rate_limit";
    const redisKey = `${keyPrefix}:${key}`;

    const pipe = redis.pipeline();

    // 1) Limpiar entradas antiguas fuera de la ventana
    pipe.zremrangebyscore(redisKey, 0, windowStart);
    // 2) Contar requests actuales
    pipe.zcard(redisKey);
    // 3) Agregar el request actual
    pipe.zadd(redisKey, { score: now, member: `${now}:${Math.random()}` });
    // 4) Asegurar expiración de la key
    pipe.expire(redisKey, Math.ceil(config.windowMs / 1000));

    const results = await pipe.exec();
    const count = (results[1] as number) ?? 0;

    const resetAt = now + config.windowMs;

    if (count > config.maxRequests) {
      const retryAfter = Math.ceil((resetAt - now) / 1000);

      if (process.env.NODE_ENV === "production") {
        console.warn(`[RATE LIMIT REDIS] Blocked: ${redisKey}, retry in ${retryAfter}s`);
      }

      return {
        ok: false,
        remaining: 0,
        resetAt,
        retryAfter,
      };
    }

    return {
      ok: true,
      remaining: Math.max(0, config.maxRequests - count),
      resetAt,
    };
  } catch (error) {
    console.error("Rate limit Redis error:", error);
    // Fail-open: si Redis falla, permitimos el request para no tumbar la app
    return {
      ok: true,
      remaining: config.maxRequests,
      resetAt: Date.now() + config.windowMs,
    };
  }
}
