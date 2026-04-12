/**
 * ETA Predictivo con corrección histórica por municipio.
 *
 * Mapbox Directions API subestima tiempos en El Salvador por tráfico
 * no modelado. Este módulo calcula factores de corrección por municipio
 * usando datos reales de RegistroEstado (EN_RUTA → ARMADO_INICIADO).
 *
 * Factor default: 1.3 (30% más tiempo que lo estimado por Mapbox)
 * Rango válido: [0.7, 2.5] — fuera de este rango se descartan outliers
 */

import { prisma } from "@/lib/prisma";
import { Redis } from "@upstash/redis";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const FACTOR_DEFAULT = 1.3;
const FACTOR_MIN = 0.7;
const FACTOR_MAX = 2.5;
const TTL_FACTOR = 6 * 3600; // 6 horas en segundos
const CACHE_KEY_PREFIX = "eta-factor";
const GLOBAL_CACHE_KEY = "eta-factor:global";

export interface EtaCorregido {
  segundosMin: number;
  segundosMax: number;
  segundosCentral: number;
  factor: number;
  municipio: string;
}

/**
 * Obtiene el factor de corrección para un municipio dado.
 * Primero intenta Redis, luego calcula desde DB, fallback a default.
 */
export async function getFactorCorreccion(municipio: string): Promise<number> {
  const cacheKey = `${CACHE_KEY_PREFIX}:${municipio.toLowerCase().replace(/\s+/g, "-")}`;

  // 1. Intentar cache Redis
  if (redis) {
    try {
      const cached = await redis.get<number>(cacheKey);
      if (cached !== null) return cached;
    } catch {
      // Redis no disponible, continuar
    }
  }

  // 2. Calcular desde DB
  const factor = await calcularFactorDesdeBD(municipio);

  // 3. Guardar en cache
  if (redis) {
    try {
      await redis.set(cacheKey, factor, { ex: TTL_FACTOR });
    } catch {
      // Ignorar error de cache
    }
  }

  return factor;
}

/**
 * Calcula el factor de corrección histórica para un municipio.
 * Compara el tiempo real de viaje con el ETA que Mapbox registró.
 *
 * Fuente de datos:
 * - Tiempo real: diferencia entre RegistroEstado ARMADO_INICIADO y EN_RUTA
 * - ETA Mapbox: campo etaEstimado del RegistroEstado EN_RUTA vs su timestamp
 */
async function calcularFactorDesdeBD(municipio: string): Promise<number> {
  try {
    const resultados = await prisma.$queryRaw<
      { factor: number; n: bigint }[]
    >`
      WITH viajes AS (
        SELECT
          AVG(
            EXTRACT(EPOCH FROM (re_llega."timestamp" - re_ruta."timestamp")) /
            NULLIF(
              EXTRACT(EPOCH FROM (re_ruta."etaEstimado" - re_ruta."timestamp")),
              0
            )
          ) AS factor,
          COUNT(*) AS n
        FROM ordenes o
        JOIN usuarios_finales uf ON uf.id = o."usuarioFinalId"
        JOIN registros_estado re_ruta
          ON re_ruta."ordenId" = o.id
          AND re_ruta."estadoCambiadoA" = 'EN_RUTA'
          AND re_ruta."etaEstimado" IS NOT NULL
        JOIN registros_estado re_llega
          ON re_llega."ordenId" = o.id
          AND re_llega."estadoCambiadoA" = 'ARMADO_INICIADO'
        WHERE
          LOWER(uf.municipio) = LOWER(${municipio})
          AND re_llega."timestamp" > re_ruta."timestamp"
          AND EXTRACT(EPOCH FROM (re_ruta."etaEstimado" - re_ruta."timestamp")) > 60
      )
      SELECT factor, n FROM viajes WHERE n >= 5
    `;

    if (resultados.length === 0 || resultados[0].factor === null) {
      return FACTOR_DEFAULT;
    }

    const factor = Number(resultados[0].factor);

    // Descartar outliers
    if (factor < FACTOR_MIN || factor > FACTOR_MAX) return FACTOR_DEFAULT;

    return Math.round(factor * 100) / 100;
  } catch {
    return FACTOR_DEFAULT;
  }
}

/**
 * Aplica corrección histórica al ETA crudo de Mapbox.
 *
 * @param mapboxSegundos - Duración en segundos devuelta por Mapbox
 * @param municipio - Municipio de destino del cliente
 * @returns Rango corregido y valor central
 */
export async function aplicarCorreccionETA(
  mapboxSegundos: number,
  municipio: string
): Promise<EtaCorregido> {
  const factor = await getFactorCorreccion(municipio);
  const central = Math.round(mapboxSegundos * factor);

  return {
    segundosCentral: central,
    segundosMin: Math.round(central * 0.85),
    segundosMax: Math.round(central * 1.2),
    factor,
    municipio,
  };
}

/**
 * Recalcula y guarda factores de corrección para todos los municipios
 * con suficientes datos. Llamado por cron job nocturno.
 */
export async function recalcularTodosLosFactores(): Promise<
  Record<string, number>
> {
  const municipios = await prisma.usuarioFinal.findMany({
    distinct: ["municipio"],
    select: { municipio: true },
  });

  const factores: Record<string, number> = {};

  for (const { municipio } of municipios) {
    const factor = await calcularFactorDesdeBD(municipio);
    factores[municipio] = factor;

    if (redis) {
      const cacheKey = `${CACHE_KEY_PREFIX}:${municipio.toLowerCase().replace(/\s+/g, "-")}`;
      await redis.set(cacheKey, factor, { ex: TTL_FACTOR }).catch(() => {});
    }
  }

  // Guardar resumen global en Redis
  if (redis) {
    await redis
      .set(GLOBAL_CACHE_KEY, JSON.stringify(factores), { ex: TTL_FACTOR })
      .catch(() => {});
  }

  return factores;
}

/**
 * Retorna todos los factores actuales (desde cache o DB).
 * Útil para mostrar en el panel de admin.
 */
export async function obtenerTodosLosFactores(): Promise<
  Record<string, number>
> {
  if (redis) {
    try {
      const cached = await redis.get<Record<string, number>>(GLOBAL_CACHE_KEY);
      if (cached) return cached;
    } catch {
      // Continuar
    }
  }
  return recalcularTodosLosFactores();
}
