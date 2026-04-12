/**
 * Sistema de Caché con Redis (Upstash)
 * 
 * Proporciona caché para datos frecuentemente consultados
 * con invalidación automática en operaciones de escritura.
 */

import { Redis } from "@upstash/redis";
import { prisma } from "./prisma";

// Inicializar Redis si las variables están configuradas
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// TTL por defecto en segundos
const DEFAULT_TTL = {
  PROYECTOS: 300,      // 5 minutos
  ARMADORES: 60,       // 1 minuto
  CONFIG: 3600,        // 1 hora
  REGLAS_COBRO: 600,   // 10 minutos
  MUEBLES: 300,        // 5 minutos
};

type CacheKey = 
  | "proyectos:all"
  | "proyectos:activos"
  | `proyecto:${string}`
  | "armadores:activos"
  | `armador:${string}`
  | "config:facturacion"
  | `reglas:${string}`
  | `muebles:${string}`;

/**
 * Obtiene un valor del caché
 */
async function get<T>(key: CacheKey): Promise<T | null> {
  if (!redis) return null;
  
  try {
    const cached = await redis.get(key);
    if (cached) {
      return typeof cached === "string" ? JSON.parse(cached) : cached as T;
    }
    return null;
  } catch (error) {
    console.error(`Cache get error for ${key}:`, error);
    return null;
  }
}

/**
 * Guarda un valor en el caché
 */
async function set<T>(key: CacheKey, value: T, ttlSeconds: number): Promise<void> {
  if (!redis) return;
  
  try {
    await redis.set(key, JSON.stringify(value), { ex: ttlSeconds });
  } catch (error) {
    console.error(`Cache set error for ${key}:`, error);
  }
}

/**
 * Invalida una o más claves del caché
 */
async function invalidate(...keys: CacheKey[]): Promise<void> {
  if (!redis) return;
  
  try {
    await redis.del(...keys);
  } catch (error) {
    console.error(`Cache invalidate error:`, error);
  }
}

/**
 * Invalida todas las claves que coincidan con un patrón
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function invalidatePattern(pattern: string): Promise<void> {
  if (!redis) return;
  
  try {
    // Upstash no soporta SCAN, así que invalidamos claves conocidas
    const knownPatterns: Record<string, CacheKey[]> = {
      "proyectos:*": ["proyectos:all", "proyectos:activos"],
      "armadores:*": ["armadores:activos"],
    };
    
    const keysToInvalidate = knownPatterns[pattern];
    if (keysToInvalidate) {
      await invalidate(...keysToInvalidate);
    }
  } catch (error) {
    console.error(`Cache invalidatePattern error:`, error);
  }
}

// ============================================
// FUNCIONES DE CACHÉ ESPECÍFICAS
// ============================================

/**
 * Obtiene todos los proyectos (con caché)
 */
export async function getProyectos() {
  const cacheKey: CacheKey = "proyectos:all";
  
  // Intentar obtener del caché
  const cached = await get<Awaited<ReturnType<typeof fetchProyectos>>>(cacheKey);
  if (cached) return cached;
  
  // Si no está en caché, obtener de BD
  const proyectos = await fetchProyectos();
  
  // Guardar en caché
  await set(cacheKey, proyectos, DEFAULT_TTL.PROYECTOS);
  
  return proyectos;
}

async function fetchProyectos() {
  return prisma.proyecto.findMany({
    orderBy: { nombreComercial: "asc" },
    include: {
      _count: {
        select: { ordenes: true, muebles: true },
      },
    },
  });
}

/**
 * Obtiene proyectos activos (con caché)
 */
export async function getProyectosActivos() {
  const cacheKey: CacheKey = "proyectos:activos";
  
  const cached = await get<Awaited<ReturnType<typeof fetchProyectosActivos>>>(cacheKey);
  if (cached) return cached;
  
  const proyectos = await fetchProyectosActivos();
  await set(cacheKey, proyectos, DEFAULT_TTL.PROYECTOS);
  
  return proyectos;
}

async function fetchProyectosActivos() {
  return prisma.proyecto.findMany({
    where: { activo: true },
    orderBy: { nombreComercial: "asc" },
    select: {
      id: true,
      nombreComercial: true,
      tipoCliente: true,
    },
  });
}

/**
 * Obtiene armadores activos (con caché)
 */
export async function getArmadoresActivos() {
  const cacheKey: CacheKey = "armadores:activos";
  
  const cached = await get<Awaited<ReturnType<typeof fetchArmadoresActivos>>>(cacheKey);
  if (cached) return cached;
  
  const armadores = await fetchArmadoresActivos();
  await set(cacheKey, armadores, DEFAULT_TTL.ARMADORES);
  
  return armadores;
}

async function fetchArmadoresActivos() {
  return prisma.armador.findMany({
    where: {
      estado: "ACTIVO",
      usuario: { activo: true, estadoLoggeo: "ACTIVO" },
    },
    include: {
      usuario: {
        select: { id: true, nombre: true, telefono: true },
      },
      _count: {
        select: { ordenes: true },
      },
    },
  });
}

/**
 * Obtiene configuración de facturación (con caché)
 */
export async function getConfigFacturacion() {
  const cacheKey: CacheKey = "config:facturacion";
  
  const cached = await get<Awaited<ReturnType<typeof fetchConfigFacturacion>>>(cacheKey);
  if (cached) return cached;
  
  const config = await fetchConfigFacturacion();
  if (config) {
    await set(cacheKey, config, DEFAULT_TTL.CONFIG);
  }
  
  return config;
}

async function fetchConfigFacturacion() {
  return prisma.configuracionFacturacion.findFirst();
}

/**
 * Obtiene reglas de cobro de un proyecto (con caché)
 */
export async function getReglasCobro(proyectoId: string) {
  const cacheKey: CacheKey = `reglas:${proyectoId}`;
  
  const cached = await get<Awaited<ReturnType<typeof fetchReglasCobro>>>(cacheKey);
  if (cached) return cached;
  
  const reglas = await fetchReglasCobro(proyectoId);
  await set(cacheKey, reglas, DEFAULT_TTL.REGLAS_COBRO);
  
  return reglas;
}

async function fetchReglasCobro(proyectoId: string) {
  return prisma.reglaCobro.findMany({
    where: { proyectoId },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Obtiene muebles de un proyecto (con caché)
 */
export async function getMueblesPorProyecto(proyectoId: string) {
  const cacheKey: CacheKey = `muebles:${proyectoId}`;
  
  const cached = await get<Awaited<ReturnType<typeof fetchMuebles>>>(cacheKey);
  if (cached) return cached;
  
  const muebles = await fetchMuebles(proyectoId);
  await set(cacheKey, muebles, DEFAULT_TTL.MUEBLES);
  
  return muebles;
}

async function fetchMuebles(proyectoId: string) {
  return prisma.mueble.findMany({
    where: { proyectoId },
    orderBy: { nombre: "asc" },
  });
}

// ============================================
// FUNCIONES DE INVALIDACIÓN
// ============================================

/**
 * Invalida caché de proyectos (llamar después de CREATE/UPDATE/DELETE)
 */
export async function invalidateProyectosCache(proyectoId?: string): Promise<void> {
  const keys: CacheKey[] = ["proyectos:all", "proyectos:activos"];
  if (proyectoId) {
    keys.push(`proyecto:${proyectoId}`);
    keys.push(`reglas:${proyectoId}`);
    keys.push(`muebles:${proyectoId}`);
  }
  await invalidate(...keys);
}

/**
 * Invalida caché de armadores (llamar después de cambio de estado)
 */
export async function invalidateArmadoresCache(armadorId?: string): Promise<void> {
  const keys: CacheKey[] = ["armadores:activos"];
  if (armadorId) {
    keys.push(`armador:${armadorId}`);
  }
  await invalidate(...keys);
}

/**
 * Invalida caché de configuración de facturación
 */
export async function invalidateConfigCache(): Promise<void> {
  await invalidate("config:facturacion");
}

/**
 * Invalida caché de reglas de cobro de un proyecto
 */
export async function invalidateReglasCache(proyectoId: string): Promise<void> {
  await invalidate(`reglas:${proyectoId}`);
}

/**
 * Invalida caché de muebles de un proyecto
 */
export async function invalidateMueblesCache(proyectoId: string): Promise<void> {
  await invalidate(`muebles:${proyectoId}`);
}

// ============================================
// UTILIDADES
// ============================================

/**
 * Verifica si el caché está disponible
 */
export function isCacheAvailable(): boolean {
  return redis !== null;
}

/**
 * Obtiene estadísticas del caché (para debugging)
 */
export async function getCacheStats(): Promise<{
  available: boolean;
  keys?: number;
}> {
  if (!redis) {
    return { available: false };
  }
  
  try {
    // Upstash no tiene DBSIZE, retornamos solo disponibilidad
    return { available: true };
  } catch {
    return { available: false };
  }
}
