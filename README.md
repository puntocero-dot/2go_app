# 🛠️ Armados 2Go

Sistema integral de gestión de armado de muebles para empresas retail.

## 📋 Índice

- [Instalación](#-instalación)
- [Variables de Entorno](#-variables-de-entorno)
- [Scripts Disponibles](#-scripts-disponibles)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Roles y Permisos](#-roles-y-permisos)
- [Documentación Adicional](#-documentación-adicional)

---

## 🚀 Instalación

### Requisitos Previos

- Node.js 18+ 
- PostgreSQL 14+
- npm o yarn

### Setup Inicial

```bash
# 1. Clonar repositorio
git clone https://github.com/tu-org/armados2go.git
cd armados2go

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# 4. Generar cliente Prisma
npx prisma generate

# 5. Ejecutar migraciones
npx prisma db push

# 6. Crear usuario admin inicial
npx ts-node scripts/create-superadmin.ts

# 7. Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

---

## 🔐 Variables de Entorno

Crea un archivo `.env` basado en `.env.example`:

```bash
# Base de datos
DATABASE_URL="postgresql://user:password@localhost:5432/armados2go"

# Autenticación (OBLIGATORIO en producción)
JWT_SECRET="tu-secreto-de-32-caracteres-minimo"

# Rate Limiting (Upstash Redis - opcional)
UPSTASH_REDIS_REST_URL="https://tu-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="tu-token"

# Cloudinary (para imágenes)
CLOUDINARY_CLOUD_NAME="tu-cloud"
CLOUDINARY_API_KEY="tu-api-key"
CLOUDINARY_API_SECRET="tu-api-secret"

# Mapbox (para mapas)
NEXT_PUBLIC_MAPBOX_TOKEN="pk.tu-token-mapbox"

# Email (Resend)
RESEND_API_KEY="re_tu-api-key"

# Entorno
NODE_ENV="development"
```

---

## 📜 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia servidor de desarrollo |
| `npm run build` | Compila para producción |
| `npm run start` | Inicia servidor de producción |
| `npm run lint` | Ejecuta ESLint |
| `npx prisma studio` | Abre Prisma Studio (GUI de BD) |
| `npx prisma db push` | Sincroniza schema con BD |
| `npx ts-node scripts/create-superadmin.ts` | Crea usuario admin |
| `npx ts-node scripts/audit-endpoints.ts` | Audita seguridad de endpoints |

---

## 📁 Estructura del Proyecto

```
armados2go/
├── app/                    # Next.js App Router
│   ├── admin/              # Páginas de administración
│   ├── armador/            # Páginas para armadores
│   ├── supervisor/         # Páginas para supervisores
│   ├── api/                # API Routes
│   └── login/              # Autenticación
├── components/             # Componentes React
│   ├── ui/                 # Componentes base (shadcn/ui)
│   └── ...                 # Componentes de negocio
├── lib/                    # Utilidades y servicios
│   ├── schemas/            # Schemas Zod
│   ├── services/           # Capa de servicios
│   └── ...                 # Helpers
├── prisma/                 # Schema de base de datos
├── docs/                   # Documentación
└── scripts/                # Scripts de utilidad
```

---

## 👥 Roles y Permisos

| Rol | Descripción | Acceso |
|-----|-------------|--------|
| **ADMIN** | Control total del sistema | `/admin/*` |
| **SUPERVISOR** | Gestión de órdenes de sus proyectos | `/supervisor/*`, `/admin/ordenes/*` |
| **ARMADOR** | Ejecución de órdenes en campo | `/armador/*` |

### Credenciales por Defecto (desarrollo)

```
Admin: admin@armados2go.com / Admin123!
```

---

## 📚 Documentación Adicional

- [Arquitectura Completa](docs/ARQUITECTURA-COMPLETA.md)
- [Seguridad](docs/SECURITY.md)
- [API Reference](docs/API.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Facturación](docs/facturacion-api.md)

---

## 🔒 Seguridad

Este proyecto implementa:

- ✅ Autenticación JWT con cookies HttpOnly
- ✅ Rate limiting con Redis/in-memory
- ✅ Validación Zod en todos los endpoints
- ✅ Sanitización de inputs (DOMPurify)
- ✅ Sistema de auditoría completo
- ✅ Security headers (CSP, HSTS, etc.)
- ✅ HTTPS enforcement en producción

Ver [SECURITY.md](docs/SECURITY.md) para más detalles.

---

## 📄 Licencia

Privado - Todos los derechos reservados