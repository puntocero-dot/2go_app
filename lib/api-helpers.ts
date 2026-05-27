import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getClientIp } from "./rate-limit";

/**
 * Wrapper para aplicar rate limiting a un endpoint
 */
export function withRateLimit(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (request: NextRequest, context?: any) => Promise<Response>,
  config: { windowMs: number; maxRequests: number },
  getKey: (request: NextRequest) => string
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (request: NextRequest, context?: any) => {
    const key = getKey(request);
    const ip = getClientIp(request);
    
    const result = await checkRateLimit(key, config, ip);
    
    if (!result.ok) {
      return NextResponse.json(
        {
          error: "Too many requests",
          message: `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": result.retryAfter?.toString() || "60",
            "X-RateLimit-Limit": config.maxRequests.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(result.resetAt).toISOString(),
          },
        }
      );
    }
    
    const response = await handler(request, context);
    
    // Agregar headers de rate limit a respuestas exitosas
    response.headers.set("X-RateLimit-Limit", config.maxRequests.toString());
    response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
    response.headers.set("X-RateLimit-Reset", new Date(result.resetAt).toISOString());
    
    return response;
  };
}

/**
 * Wrapper para validación con Zod
 */
export function withValidation<T>(
  schema: z.ZodSchema<T>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (data: T, request: NextRequest, context?: any) => Promise<Response>
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (request: NextRequest, context?: any) => {
    try {
      const body = await request.json();
      const validated = schema.parse(body);
      return handler(validated, request, context);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: "Validation failed",
            details: error.errors.map((err) => ({
              path: err.path.join("."),
              message: err.message,
            })),
          },
          { status: 400 }
        );
      }
      
      if (error instanceof SyntaxError) {
        return NextResponse.json(
          { error: "Invalid JSON" },
          { status: 400 }
        );
      }
      
      throw error;
    }
  };
}

/**
 * Combinar rate limiting + validación
 */
export function withRateLimitAndValidation<T>(
  schema: z.ZodSchema<T>,
  rateLimitConfig: { windowMs: number; maxRequests: number },
  getKey: (request: NextRequest) => string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (data: T, request: NextRequest, context?: any) => Promise<Response>
) {
  return withRateLimit(
    withValidation(schema, handler),
    rateLimitConfig,
    getKey
  );
}

/**
 * Helper para extraer session userId (para rate limit keys)
 */
export function getUserIdFromRequest(request: NextRequest): string {
  // Esto asume que ya pasaste por getSession antes
  // Alternativa: parsear el JWT aquí mismo
  const userId = request.headers.get("x-user-id");
  return userId || "anonymous";
}

/**
 * Lista de Origins permitidos para mutaciones (CSRF allowlist).
 * Se evalúa una vez al cargar el módulo.
 */
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL,
  process.env.NEXT_PUBLIC_PRODUCTION_URL,
  "https://www.armados2go.com",
  "https://armados2go.com",
  "http://localhost:3000",
  "http://localhost:3001",
].filter((value): value is string => typeof value === "string" && value.length > 0);

/**
 * Wrapper para validar Origin en mutaciones (defensa CSRF).
 *
 * - GET/HEAD/OPTIONS pasan directo (no son state-changing).
 * - POST/PUT/PATCH/DELETE deben tener Origin en la allowlist o son rechazadas.
 * - Si no hay header Origin (raro pero posible en algunos clientes server-to-server
 *   o navegadores muy viejos), se permite. Defensa secundaria a sameSite=lax cookies.
 *
 * Componible con los otros wrappers:
 *   export const POST = withCsrf(withRateLimit(handler, ...));
 */
export function withCsrf(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (request: NextRequest, context?: any) => Promise<Response>
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (request: NextRequest, context?: any): Promise<Response> => {
    const method = request.method;
    if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
      return handler(request, context);
    }

    const origin = request.headers.get("origin");
    if (origin) {
      const isAllowed = ALLOWED_ORIGINS.some((allowed) => origin.startsWith(allowed));
      if (!isAllowed) {
        console.warn(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            tipo: "CSRF_ATTEMPT_BLOCKED",
            origin,
            referer: request.headers.get("referer"),
            endpoint: request.url,
            method,
          })
        );
        return NextResponse.json({ error: "Origin no permitido" }, { status: 403 });
      }
    }

    return handler(request, context);
  };
}
