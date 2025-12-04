import { checkRateLimitRedis } from "./rate-limit-redis";

type RateLimitConfig = {
  windowMs: number;
  maxRequests: number;
};

type RateLimitEntry = {
  count: number;
  windowStart: number;
};

type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
};

const store = new Map<string, RateLimitEntry>();

// Whitelist de IPs para testing/desarrollo
const WHITELIST_IPS = [
  '127.0.0.1',
  'localhost',
  ...(process.env.RATE_LIMIT_WHITELIST?.split(',') || [])
];

// Configuraciones predefinidas
export const RATE_LIMITS = {
  GPS_TRACKING: {
    windowMs: 60 * 60 * 1000, // 1 hora
    maxRequests: parseInt(process.env.RATE_LIMIT_GPS || '120'), // 120 req/hora
  },
  UPLOAD: {
    windowMs: 60 * 60 * 1000, // 1 hora
    maxRequests: parseInt(process.env.RATE_LIMIT_UPLOAD || '10'), // 10 uploads/hora
  },
  ESTADO_LOGGEO: {
    windowMs: 60 * 60 * 1000, // 1 hora
    maxRequests: parseInt(process.env.RATE_LIMIT_ESTADO || '30'), // 30 cambios/hora
  },
  AUTH: {
    windowMs: 60 * 60 * 1000, // 1 hora
    maxRequests: parseInt(process.env.RATE_LIMIT_AUTH || '5'), // 5 intentos/hora
  },
  DEFAULT: {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: parseInt(process.env.RATE_LIMIT_DEFAULT || '60'), // 60 req/min
  },
};

// Limpiar entradas viejas cada 10 minutos
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now - entry.windowStart >= 60 * 60 * 1000) {
      store.delete(key);
    }
  }
}, 10 * 60 * 1000);

const HAS_REDIS_RATE_LIMIT =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

export async function checkRateLimit(
  key: string,
  config: RateLimitConfig,
  ip?: string
): Promise<RateLimitResult> {
  // Si Redis está configurado, usar backend distribuido
  if (HAS_REDIS_RATE_LIMIT) {
    const redisResult = await checkRateLimitRedis(key, {
      windowMs: config.windowMs,
      maxRequests: config.maxRequests,
      keyPrefix: "rate_limit",
    });

    return {
      ok: redisResult.ok,
      remaining: redisResult.remaining,
      resetAt: redisResult.resetAt,
      retryAfter: redisResult.retryAfter,
    };
  }
  // Whitelist bypass
  if (ip && WHITELIST_IPS.includes(ip)) {
    return {
      ok: true,
      remaining: config.maxRequests,
      resetAt: Date.now() + config.windowMs,
    };
  }

  const now = Date.now();
  const entry = store.get(key);

  // Nueva ventana
  if (!entry || now - entry.windowStart >= config.windowMs) {
    store.set(key, {
      count: 1,
      windowStart: now,
    });

    return {
      ok: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
    };
  }

  // Límite excedido
  if (entry.count >= config.maxRequests) {
    const resetAt = entry.windowStart + config.windowMs;
    const retryAfter = Math.ceil((resetAt - now) / 1000);

    // Log de intento bloqueado
    if (process.env.NODE_ENV === 'production') {
      console.warn(`[RATE LIMIT] Blocked: ${key}, retry in ${retryAfter}s`);
    }

    return {
      ok: false,
      remaining: 0,
      resetAt,
      retryAfter,
    };
  }

  // Incrementar contador
  entry.count += 1;

  return {
    ok: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.windowStart + config.windowMs,
  };
}

// Helper para extraer IP de request
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  return 'unknown';
}
