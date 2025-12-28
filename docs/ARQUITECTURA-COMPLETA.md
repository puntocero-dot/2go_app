# 🏗️ Arquitectura Completa - Armados 2Go

> **Última actualización:** Diciembre 2024  
> **Stack:** Next.js 14 (App Router) + PostgreSQL + Prisma + TailwindCSS

---

## 📋 Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Matriz de Jerarquía de Roles](#matriz-de-jerarquía-de-roles)
3. [Arquitectura de Servicios](#arquitectura-de-servicios)
4. [Estructura de Carpetas](#estructura-de-carpetas)
5. [APIs y Endpoints](#apis-y-endpoints)
6. [Modelos de Datos](#modelos-de-datos)
7. [Funcionalidades por Módulo](#funcionalidades-por-módulo)
8. [Sistema de Seguridad](#sistema-de-seguridad)

---

## 1. Resumen Ejecutivo

**Armados 2Go** es una plataforma de gestión de órdenes de armado de muebles con:
- **Monolito modular** en Next.js 14 (App Router)
- **3 roles principales:** ADMIN, SUPERVISOR, ARMADOR
- **Tracking GPS en tiempo real** de armadores
- **Sistema de facturación** con generación de PDFs
- **Auditoría completa** de acciones críticas

---

## 2. Matriz de Jerarquía de Roles

### 2.1 Estructura de Roles

```
┌─────────────────────────────────────────────────────────────┐
│                         ADMIN                                │
│  (Control total del sistema)                                 │
├─────────────────────────────────────────────────────────────┤
│  ✓ Gestión de usuarios (crear, editar, eliminar)            │
│  ✓ Gestión de proyectos y clientes                          │
│  ✓ Configuración del sistema (facturación, geomaps)         │
│  ✓ Auditoría y logs del sistema                             │
│  ✓ Reportes BI y analytics                                  │
│  ✓ Gestión de armadores                                     │
│  ✓ Todas las funciones de SUPERVISOR                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       SUPERVISOR                             │
│  (Operaciones de proyectos asignados)                        │
├─────────────────────────────────────────────────────────────┤
│  ✓ Ver órdenes de sus proyectos asignados                   │
│  ✓ Crear y editar órdenes                                   │
│  ✓ Asignar armadores a órdenes                              │
│  ✓ Ver mapa de armadores en tiempo real                     │
│  ✓ Reportes de tiempos de pedido                            │
│  ✗ NO puede gestionar usuarios                              │
│  ✗ NO puede acceder a configuración del sistema             │
│  ✗ NO puede ver auditoría                                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                        ARMADOR                               │
│  (Ejecución de órdenes en campo)                             │
├─────────────────────────────────────────────────────────────┤
│  ✓ Ver órdenes asignadas                                    │
│  ✓ Tomar órdenes disponibles                                │
│  ✓ Cambiar estado de órdenes (EN_RUTA → COMPLETADO)         │
│  ✓ Subir fotos/evidencias                                   │
│  ✓ Enviar ubicación GPS                                     │
│  ✓ Iniciar/finalizar turnos                                 │
│  ✗ NO puede crear órdenes                                   │
│  ✗ NO puede asignar a otros armadores                       │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Matriz de Permisos por Funcionalidad

| Funcionalidad | ADMIN | SUPERVISOR | ARMADOR |
|--------------|:-----:|:----------:|:-------:|
| **Dashboard principal** | `/admin` | `/supervisor` | `/armador` |
| **Gestión de órdenes** | ✅ Todas | ✅ Sus proyectos | ✅ Solo asignadas |
| **Crear órdenes** | ✅ | ✅ | ❌ |
| **Carga masiva órdenes** | ✅ | ✅ | ❌ |
| **Asignar armadores** | ✅ | ✅ | ❌ |
| **Tomar órdenes** | ❌ | ❌ | ✅ |
| **Cambiar estado orden** | ✅ | ✅ | ✅ (propias) |
| **Ver mapa armadores** | ✅ | ✅ | ❌ |
| **Gestión proyectos** | ✅ | ❌ | ❌ |
| **Gestión usuarios** | ✅ | ❌ | ❌ |
| **Gestión armadores** | ✅ | ❌ | ❌ |
| **Configuración sistema** | ✅ | ❌ | ❌ |
| **Configuración facturación** | ✅ | ❌ | ❌ |
| **Configuración geomaps** | ✅ | ❌ | ❌ |
| **Auditoría** | ✅ | ❌ | ❌ |
| **Reportes BI** | ✅ | ❌ | ❌ |
| **Reportes tiempos** | ✅ | ✅ | ❌ |
| **Turnos (ver todos)** | ✅ | ❌ | ❌ |
| **Turnos (propios)** | ❌ | ❌ | ✅ |
| **GPS tracking** | ❌ | ❌ | ✅ |
| **Perfil propio** | ✅ | ✅ | ✅ |

### 2.3 Rutas Protegidas (Middleware)

```typescript
// middleware.ts - Lógica de protección
/admin/*           → Solo ADMIN (excepciones abajo)
/admin/ordenes/*   → ADMIN + SUPERVISOR
/admin/mapa/*      → ADMIN + SUPERVISOR
/admin/reportes/tiempos-pedido → ADMIN + SUPERVISOR
/supervisor/*      → Solo SUPERVISOR
/armador/*         → Solo ARMADOR
/seguimiento/*     → Público (clientes finales)
```

---

## 3. Arquitectura de Servicios

### 3.1 Diagrama de Arquitectura

```
┌──────────────────────────────────────────────────────────────────┐
│                         CLIENTE                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐   │
│  │   Browser   │  │   PWA       │  │  Cliente Final          │   │
│  │   (React)   │  │  (Mobile)   │  │  (Seguimiento público)  │   │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘   │
└─────────┼────────────────┼─────────────────────┼─────────────────┘
          │                │                     │
          ▼                ▼                     ▼
┌──────────────────────────────────────────────────────────────────┐
│                      NEXT.JS APP ROUTER                           │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                     MIDDLEWARE                              │  │
│  │  • HTTPS enforcement (producción)                          │  │
│  │  • JWT verification                                        │  │
│  │  • Role-based routing                                      │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │
│  │   PAGES (SSR)   │  │   API ROUTES    │  │   COMPONENTS    │   │
│  │  /admin/*       │  │  /api/ordenes   │  │  navbar.tsx     │   │
│  │  /armador/*     │  │  /api/usuarios  │  │  mapa-*.tsx     │   │
│  │  /supervisor/*  │  │  /api/turnos    │  │  orders-*.tsx   │   │
│  │  /seguimiento/* │  │  /api/auth      │  │  ui/*           │   │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
          │
          ▼
┌──────────────────────────────────────────────────────────────────┐
│                        SERVICIOS                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐    │
│  │   PRISMA     │  │   UPSTASH    │  │   CLOUDINARY         │    │
│  │   (ORM)      │  │   (Redis)    │  │   (Imágenes)         │    │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘    │
│         │                 │                      │                │
│         ▼                 ▼                      ▼                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐    │
│  │  PostgreSQL  │  │  Rate Limit  │  │  Media Storage       │    │
│  │  (Neon/Supabase)│  │  Cache     │  │  CDN                 │    │
│  └──────────────┘  └──────────────┘  └──────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

### 3.2 Flujo de Datos por Rol

#### ADMIN Flow
```
Admin Login → /admin (Dashboard KPIs)
    ├── /admin/ordenes → CRUD órdenes, carga masiva
    ├── /admin/proyectos → CRUD proyectos, reglas cobro
    ├── /admin/usuarios → CRUD usuarios
    ├── /admin/armadores → Gestión armadores
    ├── /admin/mapa → Mapa tiempo real
    ├── /admin/turnos → Ver todos los turnos
    ├── /admin/reportes/bi-dashboard → Analytics
    ├── /admin/reportes/tiempos-pedido → Tiempos
    ├── /admin/configuracion/* → Settings
    └── /admin/auditoria → Logs
```

#### SUPERVISOR Flow
```
Supervisor Login → /supervisor (Dashboard proyectos asignados)
    ├── /admin/ordenes → Órdenes de sus proyectos
    ├── /admin/mapa → Mapa armadores
    └── /admin/reportes/tiempos-pedido → Tiempos
```

#### ARMADOR Flow
```
Armador Login → /armador (Mis órdenes)
    ├── Ver órdenes asignadas
    ├── Tomar órdenes disponibles
    ├── Cambiar estados (EN_RUTA → COMPLETADO)
    ├── Subir evidencias
    └── GPS tracking automático (turno activo)
```

---

## 4. Estructura de Carpetas

```
2go_App/
├── app/                          # Next.js App Router
│   ├── admin/                    # Páginas ADMIN
│   │   ├── page.tsx              # Dashboard principal
│   │   ├── administracion/       # Gestión general
│   │   ├── armadores/            # CRUD armadores
│   │   ├── auditoria/            # Logs de auditoría
│   │   ├── configuracion/        # Settings
│   │   │   ├── facturacion/      # Config facturación
│   │   │   ├── geomaps/          # Config GPS/mapas
│   │   │   └── notificaciones/   # Config notificaciones
│   │   ├── facturacion/          # Generación facturas
│   │   ├── mapa/                 # Mapa tiempo real
│   │   ├── ordenes/              # CRUD órdenes
│   │   │   ├── page.tsx          # Lista órdenes
│   │   │   ├── [id]/             # Detalle orden
│   │   │   ├── crear/            # Nueva orden
│   │   │   └── carga-masiva/     # Bulk upload
│   │   ├── perfil/               # Perfil usuario
│   │   ├── proyectos/            # CRUD proyectos
│   │   │   ├── page.tsx          # Lista proyectos
│   │   │   ├── [id]/             # Detalle proyecto
│   │   │   │   ├── page.tsx
│   │   │   │   ├── editar/
│   │   │   │   └── facturacion/
│   │   │   └── crear/
│   │   ├── reportes/             # Reportes
│   │   │   ├── bi-dashboard/     # BI Analytics
│   │   │   └── tiempos-pedido/   # Tiempos
│   │   ├── rutas/                # Rutas armadores
│   │   ├── turnos/               # Gestión turnos
│   │   └── usuarios/             # CRUD usuarios
│   │
│   ├── armador/                  # Páginas ARMADOR
│   │   ├── page.tsx              # Dashboard armador
│   │   ├── layout.tsx
│   │   └── ordenes/              # Detalle órdenes
│   │
│   ├── supervisor/               # Páginas SUPERVISOR
│   │   └── page.tsx              # Dashboard supervisor
│   │
│   ├── seguimiento/              # Público (clientes)
│   │   └── [id]/                 # Tracking por orden
│   │
│   ├── api/                      # API Routes
│   │   ├── armadores/            # API armadores
│   │   ├── auditoria/            # API auditoría
│   │   ├── auth/                 # Login/logout/me
│   │   ├── clientes/             # API clientes
│   │   ├── configuracion/        # API config
│   │   ├── facturacion/          # PDF, export, send
│   │   ├── muebles/              # API muebles
│   │   ├── notifications/        # Notificaciones
│   │   ├── ordenes/              # CRUD órdenes
│   │   ├── proyectos/            # CRUD proyectos
│   │   ├── reportes/             # Reportes API
│   │   ├── seguimiento/          # Tracking público
│   │   ├── turnos/               # API turnos
│   │   ├── upload/               # Subida archivos
│   │   └── usuarios/             # CRUD usuarios
│   │
│   ├── login/                    # Página login
│   ├── globals.css               # Estilos globales
│   ├── layout.tsx                # Layout raíz
│   └── page.tsx                  # Landing page
│
├── components/                   # Componentes React
│   ├── ui/                       # Componentes UI base
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── table.tsx
│   │   └── ...
│   ├── bi-dashboard/             # Componentes BI
│   ├── mapa/                     # Componentes mapa
│   ├── proyectos/                # Componentes proyectos
│   ├── navbar.tsx                # Navegación principal
│   ├── admin-orders-table.tsx    # Tabla órdenes admin
│   ├── admin-users-manager.tsx   # Gestión usuarios
│   ├── armador-*.tsx             # Componentes armador
│   ├── mapa-*.tsx                # Componentes mapa
│   └── ...
│
├── lib/                          # Utilidades y servicios
│   ├── schemas/                  # Schemas Zod
│   │   ├── auth.schemas.ts
│   │   ├── orden.schemas.ts
│   │   ├── proyecto.schemas.ts
│   │   ├── turno.schemas.ts
│   │   └── ...
│   ├── services/                 # Servicios
│   │   ├── base.service.ts
│   │   └── orden.service.ts
│   ├── pdf/                      # Generación PDFs
│   ├── api-helpers.ts            # Helpers API
│   ├── audit-logger.ts           # Sistema auditoría
│   ├── auth.ts                   # JWT, sessions
│   ├── cloudinary.ts             # Upload imágenes
│   ├── facturacion-*.ts          # Lógica facturación
│   ├── geolocation.ts            # GPS helpers
│   ├── geomaps-*.ts              # Mapas helpers
│   ├── notificaciones.ts         # Sistema notificaciones
│   ├── prisma.ts                 # Cliente Prisma
│   ├── rate-limit.ts             # Rate limiting
│   ├── rate-limit-redis.ts       # Rate limit Redis
│   ├── sanitize.ts               # Sanitización inputs
│   ├── security-headers.ts       # Headers seguridad
│   └── utils.ts                  # Utilidades generales
│
├── hooks/                        # React Hooks
│   ├── use-toast.ts
│   ├── useFeatureFlag.ts
│   └── useRutaTurno.ts
│
├── prisma/                       # Base de datos
│   └── schema.prisma             # Modelos Prisma
│
├── scripts/                      # Scripts utilidad
│   ├── audit-endpoints.ts        # Auditar endpoints
│   ├── create-superadmin.ts      # Crear admin
│   └── seed.ts                   # Seed DB
│
├── docs/                         # Documentación
├── public/                       # Assets públicos
├── middleware.ts                 # Middleware Next.js
├── next.config.ts                # Config Next.js
├── tailwind.config.ts            # Config Tailwind
└── package.json                  # Dependencias
```

---

## 5. APIs y Endpoints

### 5.1 Resumen de Endpoints (44 rutas)

| Ruta | Métodos | Auth | Validación | Rate Limit | Auditoría |
|------|---------|:----:|:----------:|:----------:|:---------:|
| `/api/auth/login` | POST | ❌ | ✅ | ✅ | ✅ |
| `/api/auth/logout` | GET,POST | ❌ | ❌ | ❌ | ❌ |
| `/api/auth/me` | GET | ✅ | ❌ | ❌ | ❌ |
| `/api/ordenes` | GET,POST | ✅ | ✅ | ❌ | ✅ |
| `/api/ordenes/[id]` | GET,PUT,DELETE | ✅ | ✅ | ❌ | ✅ |
| `/api/ordenes/[id]/tomar` | POST | ✅ | ❌ | ❌ | ✅ |
| `/api/ordenes/[id]/ruta` | GET | ✅ | ❌ | ❌ | ❌ |
| `/api/ordenes/bulk` | POST | ✅ | ❌ | ✅ | ✅ |
| `/api/ordenes/auto-asignar` | POST | ✅ | ✅ | ❌ | ✅ |
| `/api/ordenes/por-codigo` | GET | ❌ | ❌ | ✅ | ❌ |
| `/api/proyectos` | GET,POST | ✅ | ✅ | ❌ | ✅ |
| `/api/proyectos/[id]` | GET,PUT,DELETE | ✅ | ✅ | ❌ | ✅ |
| `/api/proyectos/[id]/reglas` | GET,POST,PUT,DELETE | ✅ | ✅ | ✅ | ✅ |
| `/api/usuarios` | GET,POST | ✅ | ❌ | ❌ | ✅ |
| `/api/usuarios/[id]` | PATCH | ✅ | ❌ | ✅ | ✅ |
| `/api/usuarios/perfil` | GET,PUT | ✅ | ✅ | ✅ | ✅ |
| `/api/usuarios/estado-loggeo` | PUT | ✅ | ✅ | ✅ | ✅ |
| `/api/armadores` | GET | ✅ | ❌ | ❌ | ❌ |
| `/api/armadores/mapa` | GET | ✅ | ❌ | ❌ | ❌ |
| `/api/armadores/ubicacion` | POST | ✅ | ❌ | ❌ | ❌ |
| `/api/armadores/[id]/turnos` | GET | ✅ | ❌ | ❌ | ❌ |
| `/api/turnos/iniciar` | POST | ✅ | ✅ | ✅ | ✅ |
| `/api/turnos/activo` | GET | ✅ | ❌ | ❌ | ❌ |
| `/api/turnos/[id]/ubicacion` | POST | ✅ | ✅ | ✅ | ❌ |
| `/api/turnos/[id]/finalizar` | POST | ✅ | ✅ | ✅ | ✅ |
| `/api/turnos/[id]/ruta` | GET | ✅ | ❌ | ❌ | ❌ |
| `/api/facturacion/pdf` | GET | ✅ | ❌ | ✅ | ❌ |
| `/api/facturacion/export` | GET | ✅ | ❌ | ✅ | ❌ |
| `/api/facturacion/send` | POST | ✅ | ❌ | ✅ | ❌ |
| `/api/configuracion/facturacion` | GET,PUT | ✅ | ✅ | ❌ | ✅ |
| `/api/reportes/bi-export` | GET | ✅ | ❌ | ✅ | ✅ |
| `/api/reportes/tiempos-pedido` | GET | ✅ | ❌ | ✅ | ✅ |
| `/api/notifications/order-status` | GET,POST | ✅ | ❌ | ✅ | ❌ |
| `/api/notifications/system` | GET,POST | ✅ | ❌ | ✅ | ❌ |
| `/api/upload` | POST,DELETE | ✅ | ❌ | ✅ | ✅ |
| `/api/auditoria` | GET | ✅ | ❌ | ❌ | ❌ |
| `/api/seguimiento/[id]` | GET | ❌ | ❌ | ❌ | ❌ |
| `/api/clientes` | GET,POST | ✅ | ❌ | ❌ | ❌ |
| `/api/muebles` | GET,POST | ✅ | ❌ | ❌ | ❌ |

### 5.2 Detalle por Módulo

#### Auth (`/api/auth/*`)
- **POST /login** - Autenticación con email/password, genera JWT
- **POST /logout** - Destruye sesión
- **GET /me** - Retorna usuario actual

#### Órdenes (`/api/ordenes/*`)
- **GET /** - Lista órdenes (filtros: proyecto, estado, fecha, armador)
- **POST /** - Crear orden individual
- **GET /[id]** - Detalle orden
- **PUT /[id]** - Actualizar orden
- **DELETE /[id]** - Eliminar orden
- **POST /[id]/tomar** - Armador toma orden
- **GET /[id]/ruta** - Ruta del armador para la orden
- **POST /bulk** - Carga masiva CSV
- **POST /auto-asignar** - Auto-asignación inteligente
- **GET /por-codigo** - Buscar por código referencia

#### Proyectos (`/api/proyectos/*`)
- **GET /** - Lista proyectos
- **POST /** - Crear proyecto
- **GET /[id]** - Detalle proyecto
- **PUT /[id]** - Actualizar proyecto
- **DELETE /[id]** - Eliminar proyecto
- **CRUD /[id]/reglas** - Reglas de cobro

#### Usuarios (`/api/usuarios/*`)
- **GET /** - Lista usuarios
- **POST /** - Crear usuario
- **PATCH /[id]** - Actualizar usuario
- **GET /perfil** - Mi perfil
- **PUT /perfil** - Actualizar mi perfil
- **PUT /estado-loggeo** - Cambiar estado (ACTIVO/LUNCH/BREAK/OFFLINE)

#### Turnos (`/api/turnos/*`)
- **POST /iniciar** - Iniciar turno
- **GET /activo** - Turno activo del armador
- **POST /[id]/ubicacion** - Enviar punto GPS
- **POST /[id]/finalizar** - Finalizar turno
- **GET /[id]/ruta** - Puntos de ruta del turno

---

## 6. Modelos de Datos

### 6.1 Diagrama ER Simplificado

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Usuario    │────<│   Armador    │────<│    Turno     │
│              │     │              │     │              │
│ id           │     │ id           │     │ id           │
│ email        │     │ usuarioId    │     │ armadorId    │
│ password     │     │ estado       │     │ inicioTurno  │
│ nombre       │     │ ubicacionLat │     │ finTurno     │
│ rol          │     │ ubicacionLng │     │ estado       │
│ estadoLoggeo │     └──────────────┘     └──────────────┘
└──────────────┘            │                    │
       │                    │                    │
       │                    ▼                    ▼
       │            ┌──────────────┐     ┌──────────────┐
       │            │    Orden     │     │  RutaPunto   │
       │            │              │     │              │
       │            │ id           │     │ turnoId      │
       │            │ armadorId    │     │ latitud      │
       │            │ proyectoId   │     │ longitud     │
       │            │ estado       │     │ timestamp    │
       │            │ cobroFinal   │     │ tipo         │
       │            └──────────────┘     └──────────────┘
       │                    │
       ▼                    ▼
┌──────────────┐     ┌──────────────┐
│   Proyecto   │────<│   Mueble     │
│              │     │              │
│ id           │     │ proyectoId   │
│ nombreComerc │     │ nombre       │
│ tipoCliente  │     │ tamano       │
│ activo       │     └──────────────┘
└──────────────┘
       │
       ▼
┌──────────────┐
│  ReglaCobro  │
│              │
│ proyectoId   │
│ tipoPrincipal│
│ precioFijo   │
│ precioVIP    │
└──────────────┘
```

### 6.2 Enums Principales

```typescript
enum RolUsuario {
  ADMIN
  SUPERVISOR
  ARMADOR
}

enum EstadoOrden {
  SIN_ASIGNAR
  ASIGNADO
  EN_RUTA
  ARMADO_INICIADO
  ARMADO_FINALIZADO
  ARMADO_COMPLETADO
  CANCELADA
}

enum EstadoLoggeo {
  ACTIVO
  LUNCH
  BREAK
  OFFLINE
}

enum EstadoTurno {
  ACTIVO
  PAUSADO
  FINALIZADO
  CANCELADO
}

enum EstadoArmador {
  ACTIVO
  INACTIVO
  VACACIONES
}

enum PrioridadUsuario {
  VIP
  URGENTE
  MEDIA
  NORMAL
}

enum TamanoMueble {
  GRANDE
  MEDIANO
  PEQUENO
}
```

---

## 7. Funcionalidades por Módulo

### 7.1 Módulo de Órdenes

| Funcionalidad | Descripción | Roles |
|--------------|-------------|-------|
| **Crear orden** | Formulario con cliente, mueble, dirección, prioridad | ADMIN, SUPERVISOR |
| **Carga masiva** | Upload CSV con múltiples órdenes | ADMIN, SUPERVISOR |
| **Asignar armador** | Manual o auto-asignación inteligente | ADMIN, SUPERVISOR |
| **Tomar orden** | Armador toma orden disponible | ARMADOR |
| **Cambiar estado** | Flujo: SIN_ASIGNAR → ASIGNADO → EN_RUTA → ARMADO_* → COMPLETADO | Todos |
| **Subir evidencias** | Fotos antes/después del armado | ARMADOR |
| **Ver timeline** | Historial de estados con timestamps | Todos |
| **Calcular cobro** | Automático según reglas del proyecto | Sistema |

### 7.2 Módulo de Proyectos

| Funcionalidad | Descripción | Roles |
|--------------|-------------|-------|
| **CRUD proyectos** | Crear, editar, eliminar proyectos | ADMIN |
| **Reglas de cobro** | Configurar precios por volumen, prioridad, distancia | ADMIN |
| **Asignar supervisores** | Vincular supervisores a proyectos | ADMIN |
| **Catálogo muebles** | Gestionar muebles por proyecto | ADMIN |
| **Datos facturación** | RFC, dirección fiscal, etc. | ADMIN |

### 7.3 Módulo de Usuarios

| Funcionalidad | Descripción | Roles |
|--------------|-------------|-------|
| **CRUD usuarios** | Crear, editar, desactivar usuarios | ADMIN |
| **Gestión armadores** | Crear armador asociado a usuario | ADMIN |
| **Estado de loggeo** | ACTIVO/LUNCH/BREAK/OFFLINE | Todos |
| **Perfil propio** | Editar nombre, teléfono, foto | Todos |
| **Cambiar contraseña** | Actualizar password | Todos |

### 7.4 Módulo de Turnos y GPS

| Funcionalidad | Descripción | Roles |
|--------------|-------------|-------|
| **Iniciar turno** | Comienza tracking GPS | ARMADOR |
| **Enviar ubicación** | Cada 2 min (configurable) | ARMADOR |
| **Finalizar turno** | Termina tracking | ARMADOR |
| **Ver ruta** | Polyline de puntos recorridos | ADMIN |
| **Mapa tiempo real** | Posiciones actuales de armadores | ADMIN, SUPERVISOR |
| **Detectar paradas** | Alertas de paradas prolongadas | Sistema |

### 7.5 Módulo de Facturación

| Funcionalidad | Descripción | Roles |
|--------------|-------------|-------|
| **Generar PDF** | Factura por proyecto/período | ADMIN |
| **Exportar Excel** | Datos de facturación | ADMIN |
| **Enviar por email** | Factura al cliente | ADMIN |
| **Configurar empresa** | Logo, colores, datos fiscales | ADMIN |

### 7.6 Módulo de Reportes

| Funcionalidad | Descripción | Roles |
|--------------|-------------|-------|
| **BI Dashboard** | KPIs, gráficos, tendencias | ADMIN |
| **Tiempos de pedido** | Análisis de tiempos por estado | ADMIN, SUPERVISOR |
| **Exportar datos** | CSV/Excel de reportes | ADMIN |

### 7.7 Módulo de Auditoría

| Funcionalidad | Descripción | Roles |
|--------------|-------------|-------|
| **Ver logs** | Historial de acciones | ADMIN |
| **Filtrar** | Por usuario, acción, recurso, fecha | ADMIN |
| **Exportar CSV** | Descargar logs | ADMIN |

---

## 8. Sistema de Seguridad

### 8.1 Autenticación

- **JWT** con expiración de 7 días
- **Cookies HttpOnly** para almacenar token
- **bcrypt** para hash de contraseñas
- **JWT_SECRET obligatorio** en producción

### 8.2 Rate Limiting

```typescript
RATE_LIMITS = {
  GPS_TRACKING: 120 req/hora,
  UPLOAD: 10 req/hora,
  ESTADO_LOGGEO: 30 req/hora,
  AUTH: 5 intentos/hora,
  DEFAULT: 60 req/min
}
```

- Backend: Redis (Upstash) o in-memory
- Headers: `X-RateLimit-*`

### 8.3 Validación

- **Zod schemas** para todos los inputs
- **Sanitización** con DOMPurify
- **Validación de archivos** (tipo, tamaño)

### 8.4 Auditoría

Acciones registradas:
- CREATE/UPDATE/DELETE de órdenes, usuarios, proyectos
- LOGIN/LOGOUT/FAILED_LOGIN
- Cambios de configuración
- Uploads de archivos
- Cambios de estado

### 8.5 Headers de Seguridad

```typescript
{
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Content-Security-Policy": "...",
  "Permissions-Policy": "..."
}
```

---

## 9. Mejoras Implementadas (Sprint 1)

| Tarea | Estado | Descripción |
|-------|:------:|-------------|
| 1.1 JWT_SECRET obligatorio | ✅ | Error en producción si no está definido |
| 1.2 Rate limiting Redis | ✅ | Upstash Redis para rate limit distribuido |
| 1.3 Validación Zod | ✅ | Schemas para todos los endpoints críticos |
| 1.4 Sanitización inputs | ✅ | DOMPurify + validación en schemas |
| 1.5 Sistema Auditoría | ✅ | AuditLog model + logAudit helper |
| 1.6 Security headers | ✅ | CSP, Permissions-Policy mejorados |
| 1.7 Auditoría endpoints | ✅ | Script + CSV de estado de endpoints |

---

*Documento generado para auditoría completa del sistema Armados 2Go*
