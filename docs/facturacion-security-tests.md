# Tests de seguridad - Facturación

Este documento enumera tests de seguridad básicos para los endpoints de facturación:

- `GET /api/facturacion/export`
- `GET /api/facturacion/pdf`
- `POST /api/facturacion/send`

## 1. Autenticación y autorización

- **Sin sesión**
  - Petición sin cookie `session`.
  - Resultado esperado: `401/403` con mensaje de no autorizado.

- **Usuario no ADMIN (SUPERVISOR/ARMADOR)**
  - Crear sesión con `rol !== "ADMIN"`.
  - Intentar acceder a los tres endpoints.
  - Resultado esperado: `403`.

## 2. Validación de inputs (Zod)

- **Faltan parámetros**
  - Omitir `proyectoId`, `desde` o `hasta`.
  - Esperado: `400` con `error: "Parámetros de filtro inválidos"`.

- **Fechas inválidas**
  - `desde = "2024-13-01"` o formato incorrecto.
  - `hasta = "2024-00-10"`.
  - `desde > hasta`.
  - Esperado: `400` con detalles de Zod.

- **proyectoId inexistente**
  - Usar UUID que no exista.
  - Export/PDF: `404 Proyecto no encontrado` o dataset `null`.
  - Send: error apropiado (sin dataset).

## 3. Rate limiting / abuso

- **export CSV**
  - Realizar más de 10 requests válidas en menos de 5 minutos.
  - Esperado: respuestas `429` con mensaje de demasiadas solicitudes.

- **PDF preview**
  - Más de 10 vistas previas en menos de 5 minutos.
  - Esperado: `429`.

- **Envío por email**
  - Más de 5 envíos en 15 minutos.
  - Esperado: `429`.

## 4. Integridad de datos

- **Proyecto sin `reglaCobro`**
  - Configurar proyecto activo sin regla de cobro.
  - Export/PDF/Send:
    - No debe romperse el endpoint.
    - Debe registrarse warning `FACTURACION_REGLA_COBRO_FALTANTE`.

- **Órdenes con datos incompletos**
  - Crear órdenes en el rango con `usuarioFinal` o `mueble` nulos.
  - Esperado:
    - No se incluyan en el cálculo.
    - Warning `FACTURACION_ORDENES_INCOMPLETAS` en logs.

## 5. Injection / robustez básica

- **proyectoId malicioso**
  - Enviar strings largos o con caracteres especiales en `proyectoId`.
  - Debe ser rechazado por Zod (max length, string requerido).

- **Fechas maliciosas**
  - Cadenas extremadamente largas o con caracteres especiales.
  - Deben ser rechazadas por Zod.

## 6. Seguridad de cabeceras

- **Revisar headers en respuestas**
  - Verificar que `export`, `pdf` y `send` devuelven:
    - `X-Content-Type-Options: nosniff`
    - `X-Frame-Options: DENY`
    - `Referrer-Policy: strict-origin-when-cross-origin`
    - `Strict-Transport-Security` (en producción HTTPS)
    - `Permissions-Policy` sin permisos sensibles.

## 7. Auditoría y logging

- Verificar que, para operaciones exitosas, se registra un log JSON con
  - `accion: FACTURACION_EXPORT_CSV` / `FACTURACION_PDF_PREVIEW` / `FACTURACION_SEND_EMAIL`.
  - Campos: `usuarioId`, `usuarioEmail`, `proyectoId`, `desde`, `hasta`, `totalOrdenes`, `totalFacturado`, `durationMs`, `ip`, `userAgent`.

- Verificar que errores generan logs con `tipo: *_ERROR` y mensaje de error.
