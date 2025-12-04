import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "./rate-limit";

/**
 * Wrapper para aplicar rate limiting a un endpoint
 */
export function withRateLimit(
  handler: (request: NextRequest, context?: any) => Promise<Response>,
  config: { windowMs: number; maxRequests: number },
  getKey: (request: NextRequest) => string
) {
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
  handler: (data: T, request: NextRequest, context?: any) => Promise<Response>
) {
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
