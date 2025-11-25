# 🔐 Seguridad - Armados 2GO

## Sprint 1: Seguridad Crítica - COMPLETADO ✅

Este documento describe las medidas de seguridad implementadas en el proyecto.

---

## 1. Rate Limiting

### Implementación

- **Archivo**: `lib/rate-limit.ts`
- **Wrapper**: `lib/api-helpers.ts` → `withRateLimit()`
- **Storage**: Memoria (Map) con limpieza automática cada 10 minutos

### Límites Configurados

| Endpoint | Límite | Ventana | Variable ENV |
|----------|--------|---------|--------------|
| GPS Tracking (`/api/turnos/[id]/ubicacion`) | 120 req | 1 hora | `RATE_LIMIT_GPS` |
| Upload (`/api/upload`) | 10 uploads | 1 hora | `RATE_LIMIT_UPLOAD` |
| Estado Loggeo (`/api/usuarios/estado-loggeo`) | 30 cambios | 1 hora | `RATE_LIMIT_ESTADO` |
| Auth (`/api/auth/*`) | 5 intentos | 1 hora | `RATE_LIMIT_AUTH` |
| Default | 60 req | 1 minuto | `RATE_LIMIT_DEFAULT` |

### Características

- ✅ Whitelist de IPs (desarrollo/testing)
- ✅ Headers HTTP estándar: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- ✅ Respuesta 429 con `Retry-After`
- ✅ Logging de intentos bloqueados en producción
- ✅ Extracción automática de IP (`x-forwarded-for`, `x-real-ip`)

### Uso

```typescript
import { withRateLimit } from "@/lib/api-helpers";
import { RATE_LIMITS } from "@/lib/rate-limit";

export const POST = withRateLimit(
  handler,
  RATE_LIMITS.GPS_TRACKING,
  (request) => `gps:${turnoId}`
);
```

---

## 2. Validación con Zod

### Implementación

- **Schemas**: `lib/schemas/*.schemas.ts`
- **Wrapper**: `lib/api-helpers.ts` → `withValidation()`, `withRateLimitAndValidation()`

### Schemas Creados

| Schema | Archivo | Uso |
|--------|---------|-----|
| `IniciarTurnoSchema` | `turno.schemas.ts` | POST `/api/turnos/iniciar` |
| `GuardarUbicacionSchema` | `turno.schemas.ts` | POST `/api/turnos/[id]/ubicacion` |
| `FinalizarTurnoSchema` | `turno.schemas.ts` | POST `/api/turnos/[id]/finalizar` |
| `ActualizarPerfilSchema` | `usuario.schemas.ts` | PUT `/api/usuarios/perfil` |
| `CambiarEstadoLoggeoSchema` | `usuario.schemas.ts` | POST `/api/usuarios/estado-loggeo` |
| `UploadMetadataSchema` | `upload.schemas.ts` | POST `/api/upload` |

### Características

- ✅ Validación de tipos y rangos
- ✅ Validación de coordenadas GPS (-90 a 90, -180 a 180)
- ✅ Validación de passwords (mínimo 6 caracteres, confirmación)
- ✅ Validación de archivos (tipo, tamaño)
- ✅ Respuestas de error estructuradas con detalles

### Uso

```typescript
import { withValidation } from "@/lib/api-helpers";
import { GuardarUbicacionSchema } from "@/lib/schemas/turno.schemas";

const handler = async (data, request) => {
  // data ya está validado y tipado
  const { latitud, longitud } = data;
  // ...
};

export const POST = withValidation(GuardarUbicacionSchema, handler);
```

---

## 3. HTTPS Enforcement

### Implementación

- **Archivo**: `middleware.ts`
- **Scope**: Producción únicamente

### Funcionamiento

- Verifica header `x-forwarded-proto`
- Redirect 301 a HTTPS si no está presente
- Solo activo cuando `NODE_ENV === "production"`

```typescript
if (
  process.env.NODE_ENV === "production" &&
  request.headers.get("x-forwarded-proto") !== "https"
) {
  return NextResponse.redirect(`https://...`, 301);
}
```

---

## 4. Security Headers

### Implementación

- **Archivo**: `lib/security-headers.ts`
- **Integración**: `next.config.ts` → `async headers()`

### Headers Aplicados

| Header | Valor | Propósito |
|--------|-------|-----------|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Force HTTPS por 2 años |
| `X-Content-Type-Options` | `nosniff` | Prevenir MIME sniffing |
| `X-Frame-Options` | `DENY` | Prevenir clickjacking |
| `X-XSS-Protection` | `1; mode=block` | XSS protection (legacy) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Control de referrer |
| `Permissions-Policy` | `geolocation=(self), camera=(), ...` | Permisos de features |
| `Content-Security-Policy` | Ver abajo | Prevenir XSS, injection |

### Content Security Policy (CSP)

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://api.mapbox.com;
style-src 'self' 'unsafe-inline' https://api.mapbox.com;
img-src 'self' data: https: blob:;
font-src 'self' data:;
connect-src 'self' https://api.mapbox.com https://events.mapbox.com https://res.cloudinary.com https://api.cloudinary.com;
frame-src 'none';
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
```

**Nota**: `unsafe-inline` y `unsafe-eval` son necesarios para:
- Next.js hot reload en desarrollo
- Mapbox GL JS
- Radix UI (algunos componentes)

Para producción estricta, considerar:
- Usar nonces para scripts inline
- Migrar a Mapbox sin `eval`

---

## 5. Endpoints Protegidos

### Aplicación de Seguridad

| Endpoint | Rate Limit | Validación Zod | Auth |
|----------|------------|----------------|------|
| `/api/turnos/[id]/ubicacion` | ✅ GPS_TRACKING | ✅ GuardarUbicacionSchema | ✅ Session + Ownership |
| `/api/upload` | ✅ UPLOAD | ✅ validateImageFile | ✅ Session |
| `/api/usuarios/estado-loggeo` | ⏳ Pendiente | ⏳ Pendiente | ✅ Session |
| `/api/turnos/iniciar` | ⏳ Pendiente | ⏳ Pendiente | ✅ Session |
| `/api/turnos/[id]/finalizar` | ⏳ Pendiente | ⏳ Pendiente | ✅ Session + Ownership |

**Leyenda**:
- ✅ Implementado
- ⏳ Pendiente (próximo sprint)

---

## 6. Variables de Entorno

Agregar a tu `.env`:

```bash
# Rate Limiting (opcional - defaults en código)
RATE_LIMIT_GPS="120"           # Requests/hora para GPS tracking
RATE_LIMIT_UPLOAD="10"         # Uploads/hora por usuario
RATE_LIMIT_ESTADO="30"         # Cambios de estado/hora
RATE_LIMIT_AUTH="5"            # Intentos de login/hora por IP
RATE_LIMIT_DEFAULT="60"        # Requests/minuto por defecto
RATE_LIMIT_WHITELIST="127.0.0.1,localhost"  # IPs sin límite
```

---

## 7. Testing de Seguridad

### Rate Limiting

```bash
# Test: Exceder límite de GPS
for i in {1..125}; do
  curl -X POST https://armados2go.com/api/turnos/TURNO_ID/ubicacion \
    -H "Content-Type: application/json" \
    -d '{"latitud": 13.69, "longitud": -89.21}'
done

# Debe retornar 429 después de 120 requests
```

### Security Headers

```bash
# Verificar headers
curl -I https://armados2go.com

# Debe incluir:
# Strict-Transport-Security: max-age=63072000...
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# Content-Security-Policy: ...
```

### HTTPS Enforcement

```bash
# Intentar acceder por HTTP (debe redirigir a HTTPS)
curl -L http://armados2go.com
```

---

## 8. Próximos Pasos (Sprint 2)

### Pendientes de Seguridad

1. **Auditoría**:
   - Modelo `AuditLog` en Prisma
   - Helper `logAudit()`
   - Integrar en APIs críticas

2. **Sanitización**:
   - Instalar `isomorphic-dompurify`
   - Helper `sanitizeHTML()` y `sanitizeText()`
   - Aplicar en schemas Zod

3. **Completar Rate Limiting**:
   - `/api/usuarios/estado-loggeo`
   - `/api/turnos/iniciar`
   - `/api/turnos/[id]/finalizar`
   - `/api/auth/*`

4. **Completar Validación Zod**:
   - Todos los endpoints de `/api/ordenes/*`
   - Todos los endpoints de `/api/configuracion/*`

5. **Redis para Rate Limiting** (opcional):
   - Migrar de memoria a Upstash Redis
   - Mejor para múltiples instancias/serverless

---

## 9. Recursos

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Headers](https://nextjs.org/docs/app/api-reference/next-config-js/headers)
- [Zod Documentation](https://zod.dev/)
- [Content Security Policy Reference](https://content-security-policy.com/)

---

**Última actualización**: Sprint 1 - Seguridad Crítica
**Estado**: ✅ Completado (5/5 puntos)
