/**
 * Sistema de Feature Flags para activar/desactivar funcionalidades
 * sin necesidad de deploy. Permite rollout gradual y rollback seguro.
 */

export type FeatureFlag =
  | 'TRACKING_AUTO'
  | 'PDF_V2'
  | 'RATE_LIMIT_STRICT'
  | 'SMART_SAMPLING'
  | 'POLYLINE_ENCODING'
  | 'SERVICE_LAYER'
  | 'AUDITORIA_DETALLADA';

interface FlagConfig {
  enabled: boolean;
  rolloutPercentage?: number;
  allowedRoles?: ('ADMIN' | 'SUPERVISOR' | 'ARMADOR')[];
  description: string;
}

const FLAGS: Record<FeatureFlag, FlagConfig> = {
  TRACKING_AUTO: {
    enabled: process.env.NEXT_PUBLIC_FF_TRACKING_AUTO === 'true',
    rolloutPercentage: 100,
    allowedRoles: ['ARMADOR'],
    description: 'Tracking GPS automático cada 30 segundos',
  },
  PDF_V2: {
    enabled: process.env.NEXT_PUBLIC_FF_PDF_V2 === 'true',
    rolloutPercentage: 0,
    allowedRoles: ['ADMIN'],
    description: 'Nueva versión del motor de PDFs (refactorizado)',
  },
  RATE_LIMIT_STRICT: {
    enabled: process.env.NEXT_PUBLIC_FF_RATE_LIMIT_STRICT !== 'false',
    rolloutPercentage: 100,
    description: 'Rate limiting estricto en APIs',
  },
  SMART_SAMPLING: {
    enabled: process.env.NEXT_PUBLIC_FF_SMART_SAMPLING !== 'false',
    rolloutPercentage: 100,
    allowedRoles: ['ARMADOR'],
    description: 'Solo guardar puntos GPS con movimiento > 50m',
  },
  POLYLINE_ENCODING: {
    enabled: process.env.NEXT_PUBLIC_FF_POLYLINE_ENCODING === 'true',
    rolloutPercentage: 100,
    description: 'Comprimir rutas GPS con algoritmo Polyline',
  },
  SERVICE_LAYER: {
    enabled: process.env.NEXT_PUBLIC_FF_SERVICE_LAYER === 'true',
    rolloutPercentage: 0,
    description: 'Usar nueva capa de servicios en lugar de lógica en APIs',
  },
  AUDITORIA_DETALLADA: {
    enabled: process.env.NEXT_PUBLIC_FF_AUDITORIA_DETALLADA !== 'false',
    rolloutPercentage: 100,
    allowedRoles: ['ADMIN'],
    description: 'Logging detallado de todas las acciones',
  },
};

/**
 * Hash simple para rollout gradual basado en userId
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Verificar si una feature está habilitada
 */
export function isFeatureEnabled(
  flag: FeatureFlag,
  userId?: string,
  userRole?: 'ADMIN' | 'SUPERVISOR' | 'ARMADOR'
): boolean {
  const config = FLAGS[flag];

  if (!config.enabled) return false;

  // Verificar roles permitidos
  if (config.allowedRoles && userRole) {
    if (!config.allowedRoles.includes(userRole)) {
      return false;
    }
  }

  // Verificar rollout percentage (hash del userId)
  if (
    config.rolloutPercentage !== undefined &&
    config.rolloutPercentage < 100 &&
    userId
  ) {
    const hash = simpleHash(userId);
    return hash % 100 < config.rolloutPercentage;
  }

  return config.enabled;
}

/**
 * Obtener configuración de un flag
 */
export function getFlagConfig(flag: FeatureFlag): FlagConfig {
  return FLAGS[flag];
}

/**
 * Obtener todos los flags con su estado actual
 */
export function getAllFlags(): Record<FeatureFlag, FlagConfig> {
  return { ...FLAGS };
}

/**
 * Obtener flags habilitados para un usuario específico
 */
export function getEnabledFlagsForUser(
  userId?: string,
  userRole?: 'ADMIN' | 'SUPERVISOR' | 'ARMADOR'
): FeatureFlag[] {
  return (Object.keys(FLAGS) as FeatureFlag[]).filter((flag) =>
    isFeatureEnabled(flag, userId, userRole)
  );
}
