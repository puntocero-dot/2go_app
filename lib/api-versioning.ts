/**
 * Sistema de Versionado de API
 * 
 * Permite evolucionar la API sin romper clientes existentes.
 * Soporta versionado por header o por path.
 */

import { NextRequest, NextResponse } from "next/server";

export type APIVersion = "v1" | "v2";

export const CURRENT_VERSION: APIVersion = "v1";
export const SUPPORTED_VERSIONS: APIVersion[] = ["v1"];
export const DEPRECATED_VERSIONS: APIVersion[] = [];

// Fechas de deprecación
export const DEPRECATION_DATES: Record<APIVersion, string | null> = {
  v1: null, // Sin fecha de deprecación
  v2: null,
};

/**
 * Extrae la versión de la API del request
 * Prioridad: Header > Path > Default
 */
export function getAPIVersion(request: NextRequest): APIVersion {
  // 1. Intentar obtener del header Accept
  const acceptHeader = request.headers.get("Accept");
  if (acceptHeader) {
    const versionMatch = acceptHeader.match(/version=(\d+)/);
    if (versionMatch) {
      const version = `v${versionMatch[1]}` as APIVersion;
      if (SUPPORTED_VERSIONS.includes(version)) {
        return version;
      }
    }
  }

  // 2. Intentar obtener del header X-API-Version
  const versionHeader = request.headers.get("X-API-Version");
  if (versionHeader) {
    const version = versionHeader.startsWith("v") 
      ? versionHeader as APIVersion 
      : `v${versionHeader}` as APIVersion;
    if (SUPPORTED_VERSIONS.includes(version)) {
      return version;
    }
  }

  // 3. Intentar obtener del path
  const pathname = request.nextUrl.pathname;
  const pathMatch = pathname.match(/\/api\/(v\d+)\//);
  if (pathMatch) {
    const version = pathMatch[1] as APIVersion;
    if (SUPPORTED_VERSIONS.includes(version)) {
      return version;
    }
  }

  // 4. Retornar versión por defecto
  return CURRENT_VERSION;
}

/**
 * Verifica si una versión está soportada
 */
export function isVersionSupported(version: APIVersion): boolean {
  return SUPPORTED_VERSIONS.includes(version);
}

/**
 * Verifica si una versión está deprecada
 */
export function isVersionDeprecated(version: APIVersion): boolean {
  return DEPRECATED_VERSIONS.includes(version);
}

/**
 * Agrega headers de versionado a la respuesta
 */
export function addVersionHeaders(
  response: NextResponse,
  version: APIVersion
): NextResponse {
  response.headers.set("X-API-Version", version);
  response.headers.set("X-API-Supported-Versions", SUPPORTED_VERSIONS.join(", "));
  
  if (isVersionDeprecated(version)) {
    const deprecationDate = DEPRECATION_DATES[version];
    if (deprecationDate) {
      response.headers.set("Deprecation", deprecationDate);
      response.headers.set(
        "Sunset", 
        new Date(deprecationDate).toUTCString()
      );
    }
    response.headers.set(
      "Warning",
      `299 - "API version ${version} is deprecated. Please migrate to ${CURRENT_VERSION}"`
    );
  }
  
  return response;
}

/**
 * Middleware wrapper para versionado de API
 */
export function withAPIVersion<T>(
  handlers: Partial<Record<APIVersion, (request: NextRequest) => Promise<T>>>
) {
  return async (request: NextRequest): Promise<T | NextResponse> => {
    const version = getAPIVersion(request);
    
    // Verificar si la versión está soportada
    if (!isVersionSupported(version)) {
      return NextResponse.json(
        {
          error: "Versión de API no soportada",
          supportedVersions: SUPPORTED_VERSIONS,
          currentVersion: CURRENT_VERSION,
        },
        { status: 400 }
      );
    }
    
    // Obtener el handler para la versión
    const handler = handlers[version] || handlers[CURRENT_VERSION];
    
    if (!handler) {
      return NextResponse.json(
        { error: "Handler no encontrado para esta versión" },
        { status: 500 }
      );
    }
    
    return handler(request);
  };
}

/**
 * Helper para crear respuestas versionadas
 */
export function versionedResponse<T>(
  data: T,
  version: APIVersion,
  status: number = 200
): NextResponse {
  const response = NextResponse.json(data, { status });
  return addVersionHeaders(response, version);
}

/**
 * Documentación de cambios entre versiones
 */
export const VERSION_CHANGELOG: Record<APIVersion, string[]> = {
  v1: [
    "Versión inicial de la API",
    "Endpoints de órdenes, proyectos, usuarios, turnos",
    "Autenticación JWT",
    "Rate limiting",
  ],
  v2: [
    "Pendiente de implementación",
  ],
};

/**
 * Obtiene información de la versión actual
 */
export function getVersionInfo(version: APIVersion = CURRENT_VERSION) {
  return {
    version,
    current: version === CURRENT_VERSION,
    supported: isVersionSupported(version),
    deprecated: isVersionDeprecated(version),
    deprecationDate: DEPRECATION_DATES[version],
    changelog: VERSION_CHANGELOG[version] || [],
  };
}
