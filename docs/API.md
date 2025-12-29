# 📡 API Reference - Armados 2Go

> **Base URL:** `https://tu-dominio.com/api`  
> **Autenticación:** JWT via cookies HttpOnly

---

## 📋 Índice

1. [Autenticación](#1-autenticación)
2. [Órdenes](#2-órdenes)
3. [Proyectos](#3-proyectos)
4. [Usuarios](#4-usuarios)
5. [Armadores](#5-armadores)
6. [Turnos](#6-turnos)
7. [Clientes](#7-clientes)
8. [Muebles](#8-muebles)
9. [Facturación](#9-facturación)
10. [Reportes](#10-reportes)
11. [Configuración](#11-configuración)
12. [Auditoría](#12-auditoría)

---

## 1. Autenticación

### POST /api/auth/login

Inicia sesión y establece cookie de autenticación.

**Request:**
```json
{
  "email": "admin@armados2go.com",
  "password": "Admin123!"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "clx...",
    "email": "admin@armados2go.com",
    "nombre": "Admin",
    "rol": "ADMIN"
  }
}
```

**Errores:**
- `401` - Credenciales inválidas
- `429` - Rate limit excedido (5 intentos/hora)

---

### POST /api/auth/logout

Cierra sesión y elimina cookie.

**Response (200):**
```json
{ "message": "Sesión cerrada" }
```

---

### GET /api/auth/me

Obtiene usuario actual.

**Headers:** Cookie de sesión requerida

**Response (200):**
```json
{
  "user": {
    "id": "clx...",
    "email": "admin@armados2go.com",
    "nombre": "Admin",
    "rol": "ADMIN"
  }
}
```

---

## 2. Órdenes

### GET /api/ordenes

Lista órdenes con filtros.

**Query Params:**
| Param | Tipo | Descripción |
|-------|------|-------------|
| `proyectoId` | string | Filtrar por proyecto |
| `estado` | string | Filtrar por estado |
| `armadorId` | string | Filtrar por armador |
| `fechaDesde` | ISO date | Fecha inicio |
| `fechaHasta` | ISO date | Fecha fin |

**Response (200):**
```json
{
  "ordenes": [
    {
      "id": "clx...",
      "codigoReferencia": "ORD-001",
      "estado": "PENDIENTE",
      "clienteNombre": "Juan Pérez",
      "proyecto": { "nombreComercial": "IKEA" },
      "armador": { "usuario": { "nombre": "Carlos" } }
    }
  ]
}
```

---

### POST /api/ordenes

Crea una nueva orden.

**Request:**
```json
{
  "codigoReferencia": "ORD-001",
  "proyectoId": "clx...",
  "clienteNombre": "Juan Pérez",
  "clienteTelefono": "7777-8888",
  "clienteDireccion": "Col. Escalón #123",
  "municipio": "San Salvador",
  "departamento": "San Salvador",
  "muebleId": "clx...",
  "prioridad": "NORMAL",
  "fechaEntrega": "2024-12-30"
}
```

**Response (201):**
```json
{
  "orden": {
    "id": "clx...",
    "codigoReferencia": "ORD-001",
    "estado": "SIN_ASIGNAR"
  }
}
```

---

### PUT /api/ordenes/[id]

Actualiza una orden.

**Request:**
```json
{
  "estado": "ASIGNADO",
  "armadorId": "clx..."
}
```

---

### DELETE /api/ordenes/[id]

Elimina una orden.

---

### POST /api/ordenes/[id]/tomar

Armador toma una orden disponible.

**Response (200):**
```json
{
  "message": "Orden tomada exitosamente",
  "orden": { "id": "clx...", "estado": "ASIGNADO" }
}
```

---

### POST /api/ordenes/auto-asignar

Auto-asigna órdenes pendientes a armadores disponibles.

**Request:**
```json
{
  "ordenesIds": ["clx...", "clx..."]
}
```

---

### POST /api/ordenes/bulk

Carga masiva de órdenes via CSV.

**Request:** `multipart/form-data` con archivo CSV

---

## 3. Proyectos

### GET /api/proyectos

Lista todos los proyectos.

**Response (200):**
```json
{
  "proyectos": [
    {
      "id": "clx...",
      "nombreComercial": "IKEA",
      "tipoCliente": "RETAIL",
      "activo": true
    }
  ]
}
```

---

### POST /api/proyectos

Crea un nuevo proyecto.

**Request:**
```json
{
  "nombreComercial": "IKEA",
  "tipoCliente": "RETAIL",
  "rfc": "IKE123456ABC",
  "direccionFiscal": "Av. Principal #100"
}
```

---

### GET /api/proyectos/[id]/reglas

Obtiene reglas de cobro del proyecto.

---

### POST /api/proyectos/[id]/reglas

Crea regla de cobro.

**Request:**
```json
{
  "tipoPrincipal": "POR_MUEBLE",
  "precioBase": 25.00,
  "precioVIP": 35.00,
  "precioUrgente": 40.00
}
```

---

## 4. Usuarios

### GET /api/usuarios

Lista usuarios (solo ADMIN).

**Query Params:**
| Param | Tipo | Descripción |
|-------|------|-------------|
| `rol` | string | Filtrar por rol (ADMIN, SUPERVISOR, ARMADOR) |

---

### POST /api/usuarios

Crea un nuevo usuario.

**Request:**
```json
{
  "nombre": "Carlos López",
  "email": "carlos@armados2go.com",
  "password": "Secure123!",
  "telefono": "7777-8888",
  "rol": "ARMADOR",
  "estadoArmador": "ACTIVO",
  "habilidades": ["muebles_grandes", "electrodomesticos"]
}
```

---

### PATCH /api/usuarios/[id]

Actualiza un usuario.

---

### GET /api/usuarios/perfil

Obtiene perfil del usuario actual.

---

### PUT /api/usuarios/perfil

Actualiza perfil propio.

**Request:**
```json
{
  "nombre": "Carlos López",
  "telefono": "7777-9999"
}
```

---

### PUT /api/usuarios/estado-loggeo

Cambia estado de loggeo.

**Request:**
```json
{
  "estadoLoggeo": "ACTIVO"
}
```

**Valores permitidos:** `ACTIVO`, `LUNCH`, `BREAK`, `OFFLINE`

---

## 5. Armadores

### GET /api/armadores

Lista armadores activos.

---

### GET /api/armadores/mapa

Obtiene ubicaciones para mapa en tiempo real.

**Response (200):**
```json
{
  "armadores": [
    {
      "id": "clx...",
      "nombre": "Carlos",
      "lat": 13.6929,
      "lng": -89.2182,
      "ultimaActualizacion": "2024-12-28T22:00:00Z",
      "ordenesActivas": 2
    }
  ]
}
```

---

### POST /api/armadores/ubicacion

Actualiza ubicación del armador.

**Request:**
```json
{
  "lat": 13.6929,
  "lng": -89.2182
}
```

---

## 6. Turnos

### POST /api/turnos/iniciar

Inicia un nuevo turno.

**Request:**
```json
{
  "latitudInicio": 13.6929,
  "longitudInicio": -89.2182
}
```

---

### GET /api/turnos/activo

Obtiene turno activo del armador.

---

### POST /api/turnos/[id]/ubicacion

Guarda punto GPS en la ruta.

**Request:**
```json
{
  "latitud": 13.6929,
  "longitud": -89.2182
}
```

**Rate Limit:** 120 requests/hora

---

### POST /api/turnos/[id]/finalizar

Finaliza el turno.

**Request:**
```json
{
  "latitudFin": 13.6929,
  "longitudFin": -89.2182
}
```

---

### GET /api/turnos/[id]/ruta

Obtiene puntos de ruta del turno.

---

## 7. Clientes

### GET /api/clientes

Lista clientes (usuarios finales).

**Query Params:**
| Param | Tipo | Descripción |
|-------|------|-------------|
| `proyectoId` | string | Filtrar por proyecto |

---

### POST /api/clientes

Crea un nuevo cliente.

**Request:**
```json
{
  "nombre": "María García",
  "telefono": "7777-1234",
  "email": "maria@email.com",
  "direccionCompleta": "Col. San Benito #456",
  "municipio": "San Salvador",
  "departamento": "San Salvador",
  "proyectoId": "clx...",
  "prioridad": "NORMAL"
}
```

---

## 8. Muebles

### GET /api/muebles

Lista muebles.

**Query Params:**
| Param | Tipo | Descripción |
|-------|------|-------------|
| `proyectoId` | string | Filtrar por proyecto |

---

### POST /api/muebles

Crea un nuevo mueble (solo ADMIN).

**Request:**
```json
{
  "nombre": "Closet 3 puertas",
  "tamano": "GRANDE",
  "descripcion": "Closet de madera con espejo",
  "proyectoId": "clx..."
}
```

**Tamaños permitidos:** `GRANDE`, `MEDIANO`, `PEQUENO`

---

## 9. Facturación

### GET /api/facturacion/pdf

Genera PDF de facturación.

**Query Params:**
| Param | Tipo | Descripción |
|-------|------|-------------|
| `proyectoId` | string | ID del proyecto |
| `fechaInicio` | ISO date | Fecha inicio |
| `fechaFin` | ISO date | Fecha fin |

**Response:** `application/pdf`

---

### GET /api/facturacion/export

Exporta datos de facturación a Excel.

---

### POST /api/facturacion/send

Envía factura por email.

**Request:**
```json
{
  "proyectoId": "clx...",
  "fechaInicio": "2024-12-01",
  "fechaFin": "2024-12-31",
  "destinatario": "cliente@email.com"
}
```

---

## 10. Reportes

### GET /api/reportes/bi-export

Exporta datos para BI dashboard.

---

### GET /api/reportes/tiempos-pedido

Obtiene análisis de tiempos por pedido.

---

## 11. Configuración

### GET /api/configuracion/facturacion

Obtiene configuración de facturación.

---

### PUT /api/configuracion/facturacion

Actualiza configuración de facturación.

**Request:**
```json
{
  "nombreEmpresa": "Armados 2Go S.A.",
  "rfc": "ARM123456ABC",
  "direccion": "Av. Principal #100",
  "telefono": "2222-3333",
  "email": "facturacion@armados2go.com",
  "logoUrl": "https://..."
}
```

---

## 12. Auditoría

### GET /api/auditoria

Obtiene logs de auditoría (solo ADMIN).

**Query Params:**
| Param | Tipo | Descripción |
|-------|------|-------------|
| `userId` | string | Filtrar por usuario |
| `action` | string | Filtrar por acción |
| `resource` | string | Filtrar por recurso |
| `startDate` | ISO date | Fecha inicio |
| `endDate` | ISO date | Fecha fin |
| `limit` | number | Límite de resultados |
| `offset` | number | Offset para paginación |

---

## 🔒 Seguridad

### Rate Limiting

| Endpoint | Límite | Ventana |
|----------|--------|---------|
| `/api/auth/login` | 5 | 1 hora |
| `/api/turnos/[id]/ubicacion` | 120 | 1 hora |
| `/api/upload` | 10 | 1 hora |
| Default | 60 | 1 minuto |

### Códigos de Error

| Código | Descripción |
|--------|-------------|
| `400` | Datos inválidos |
| `401` | No autenticado |
| `403` | No autorizado |
| `404` | Recurso no encontrado |
| `409` | Conflicto (ej: email duplicado) |
| `429` | Rate limit excedido |
| `500` | Error interno |

---

*Última actualización: Diciembre 2024*
