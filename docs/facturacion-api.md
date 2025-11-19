# API de Facturación

Endpoints para exportar, previsualizar y enviar facturación.

## Autenticación y rol

- Requiere cookie `session` válida.
- Sólo usuarios con `rol: "ADMIN"` pueden acceder.

## Filtros comunes

Todos los endpoints usan los mismos filtros, validados con Zod:

- `proyectoId` (string, requerido, proyecto activo).
- `desde` (string `YYYY-MM-DD`, requerido).
- `hasta` (string `YYYY-MM-DD`, requerido, `hasta >= desde`).

## 1. Export CSV

- **Método**: `GET`
- **Ruta**: `/api/facturacion/export`
- **Query params**:
  - `proyectoId`
  - `desde`
  - `hasta`
- **Respuesta exitosa**: `200 OK`
  - `Content-Type: text/csv; charset=utf-8`
  - `Content-Disposition: attachment; filename="facturacion_<proyecto>_<desde>_a_<hasta>.csv"`
  - Incluye filas con desglose por concepto (ARMADO, TAMANO, DISTANCIA, PENALIZACION, PRIORIDAD).
- **Códigos de error**:
  - `400`: parámetros inválidos (Zod).
  - `403`: no autorizado (no ADMIN).
  - `404`: proyecto no encontrado / sin dataset.
  - `429`: rate limit excedido (10 req / 5min por usuario).
  - `500`: error interno.

## 2. PDF de resumen

- **Método**: `GET`
- **Ruta**: `/api/facturacion/pdf`
- **Query params**:
  - `proyectoId`
  - `desde`
  - `hasta`
- **Respuesta exitosa**: `200 OK`
  - `Content-Type: application/pdf`
  - `Content-Disposition: inline; filename="facturacion_<proyecto>_<desde>_a_<hasta>.pdf"`
  - PDF con resumen de órdenes y conceptos.
- **Códigos de error**:
  - `400`: parámetros inválidos.
  - `403`: no autorizado.
  - `404`: sin órdenes facturables en el periodo.
  - `429`: rate limit excedido (10 req / 5min).
  - `500`: error interno.

## 3. Envío de facturación por correo

- **Método**: `POST`
- **Ruta**: `/api/facturacion/send`
- **Body (JSON)**:
  - `proyectoId: string`
  - `desde: string (YYYY-MM-DD)`
  - `hasta: string (YYYY-MM-DD)`
- **Comportamiento**:
  - Calcula dataset de facturación (mismas reglas que PDF).
  - Usa `datosFacturacion.contacto.email` del proyecto como destinatario.
  - Envía correo con Resend:
    - Asunto: `Facturación <Proyecto> - <Periodo>`.
    - Adjunta PDF resumen y CSV detalle.
- **Respuesta exitosa**: `200 OK`
  - Body: `{ ok: true, message: "Facturación enviada al correo de contacto del proyecto." }`
- **Códigos de error**:
  - `400`: filtros inválidos / sin órdenes facturables / proyecto sin email de contacto.
  - `403`: no autorizado.
  - `429`: rate limit excedido (5 envíos / 15min).
  - `500`: error interno.

## Cabeceras de seguridad comunes

Los tres endpoints devuelven, además del contenido principal:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains` (en producción HTTPS)
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`

## Rate limiting

- Export CSV: 10 solicitudes por usuario cada 5 minutos.
- PDF: 10 vistas previas por usuario cada 5 minutos.
- Send Email: 5 envíos por usuario cada 15 minutos.

Cuando se excede el límite:

- Código: `429 Too Many Requests`.
- Body: mensaje explicando que se han enviado demasiadas solicitudes y se debe intentar más tarde.

## Auditoría y logging

Cada acción crítica genera un log JSON estructurado (por consola):

- `FACTURACION_EXPORT_CSV`
- `FACTURACION_PDF_PREVIEW`
- `FACTURACION_SEND_EMAIL`

Con campos:

- `timestamp`
- `usuarioId`, `usuarioEmail`
- `proyectoId`, `desde`, `hasta`
- `totalOrdenes`, `totalFacturado`
- `durationMs`
- `ip`, `userAgent`

Errores generan logs `*_ERROR` con detalle del mensaje de error.
