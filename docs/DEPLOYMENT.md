# 🚀 Deployment Guide - Armados 2Go

> Guía completa para desplegar Armados 2Go en producción

---

## 📋 Índice

1. [Requisitos Previos](#1-requisitos-previos)
2. [Configuración de Vercel](#2-configuración-de-vercel)
3. [Variables de Entorno](#3-variables-de-entorno)
4. [Base de Datos](#4-base-de-datos)
5. [Proceso de Release](#5-proceso-de-release)
6. [Monitoreo](#6-monitoreo)
7. [Rollback](#7-rollback)
8. [Checklist Pre-Deploy](#8-checklist-pre-deploy)

---

## 1. Requisitos Previos

### Servicios Externos

| Servicio | Propósito | URL |
|----------|-----------|-----|
| **Vercel** | Hosting | https://vercel.com |
| **Neon/Supabase** | PostgreSQL | https://neon.tech |
| **Upstash** | Redis (rate limiting) | https://upstash.com |
| **Cloudinary** | Almacenamiento de imágenes | https://cloudinary.com |
| **Mapbox** | Mapas | https://mapbox.com |
| **Resend** | Emails transaccionales | https://resend.com |

### Cuentas Necesarias

- [ ] Cuenta de Vercel conectada a GitHub
- [ ] Base de datos PostgreSQL en Neon o Supabase
- [ ] Cuenta de Upstash con Redis creado
- [ ] Cuenta de Cloudinary configurada
- [ ] Token de Mapbox
- [ ] API Key de Resend

---

## 2. Configuración de Vercel

### Conectar Repositorio

1. Ir a [Vercel Dashboard](https://vercel.com/dashboard)
2. Click en "Add New Project"
3. Importar repositorio desde GitHub
4. Seleccionar `armados2go`
5. Configurar:
   - **Framework Preset:** Next.js
   - **Root Directory:** ./
   - **Build Command:** `npm run build`
   - **Output Directory:** .next

### Dominios

1. En Project Settings → Domains
2. Agregar dominio personalizado
3. Configurar DNS según instrucciones de Vercel

```
# Ejemplo DNS
A     @     76.76.21.21
CNAME www   cname.vercel-dns.com
```

---

## 3. Variables de Entorno

### En Vercel Dashboard

Project Settings → Environment Variables

```bash
# Base de datos (OBLIGATORIO)
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"

# Autenticación (OBLIGATORIO - mínimo 32 caracteres)
JWT_SECRET="tu-secreto-super-seguro-de-al-menos-32-caracteres"

# Rate Limiting (RECOMENDADO)
UPSTASH_REDIS_REST_URL="https://tu-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="AXxx..."

# Cloudinary (OBLIGATORIO para imágenes)
CLOUDINARY_CLOUD_NAME="tu-cloud"
CLOUDINARY_API_KEY="123456789"
CLOUDINARY_API_SECRET="abc123..."

# Mapbox (OBLIGATORIO para mapas)
NEXT_PUBLIC_MAPBOX_TOKEN="pk.eyJ1..."

# Email (OBLIGATORIO para notificaciones)
RESEND_API_KEY="re_..."

# Entorno
NODE_ENV="production"
```

### Scopes de Variables

| Variable | Production | Preview | Development |
|----------|:----------:|:-------:|:-----------:|
| DATABASE_URL | ✅ (prod DB) | ✅ (staging DB) | ❌ |
| JWT_SECRET | ✅ | ✅ | ❌ |
| Otras | ✅ | ✅ | ❌ |

---

## 4. Base de Datos

### Neon (Recomendado)

1. Crear proyecto en [Neon Console](https://console.neon.tech)
2. Copiar connection string
3. Agregar a Vercel como `DATABASE_URL`

### Migraciones

```bash
# Desde local, con DATABASE_URL apuntando a producción
npx prisma db push

# O usar Prisma Migrate para migraciones versionadas
npx prisma migrate deploy
```

### Crear Admin Inicial

```bash
# Ejecutar script de creación de superadmin
npx ts-node scripts/create-superadmin-prd.ts
```

---

## 5. Proceso de Release

### Ambientes

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Development  │───>│   Preview    │───>│  Production  │
│ (localhost)  │    │  (PR branch) │    │   (master)   │
└──────────────┘    └──────────────┘    └──────────────┘
```

### Flujo de Trabajo

1. **Desarrollo Local**
   ```bash
   git checkout -b feature/nueva-funcionalidad
   # Desarrollar y probar
   git commit -m "feat: nueva funcionalidad"
   git push origin feature/nueva-funcionalidad
   ```

2. **Pull Request**
   - Crear PR hacia `master`
   - Vercel crea deploy de preview automático
   - Revisar en URL de preview

3. **Merge a Master**
   ```bash
   # Después de aprobar PR
   git checkout master
   git pull origin master
   git merge feature/nueva-funcionalidad
   git push origin master
   ```

4. **Deploy Automático**
   - Vercel detecta push a `master`
   - Build y deploy automático
   - Disponible en producción en ~2 minutos

### Tags de Versión

```bash
# Crear tag de versión
git tag -a v1.2.3 -m "Release v1.2.3: descripción"
git push origin v1.2.3
```

---

## 6. Monitoreo

### Vercel Analytics

- Habilitado por defecto
- Ver en Project → Analytics

### Logs

```bash
# Ver logs en tiempo real
vercel logs --follow

# Ver logs de un deployment específico
vercel logs [deployment-url]
```

### Alertas Recomendadas

1. **Uptime Monitoring**
   - Usar Vercel Checks o servicio externo
   - Alertar si respuesta > 5s o status != 200

2. **Error Tracking**
   - Integrar Sentry (opcional)
   - Alertar en errores 5xx

3. **Base de Datos**
   - Monitorear conexiones en Neon dashboard
   - Alertar si conexiones > 80%

---

## 7. Rollback

### Desde Vercel Dashboard

1. Ir a Project → Deployments
2. Encontrar deployment anterior estable
3. Click en "..." → "Promote to Production"

### Desde CLI

```bash
# Listar deployments
vercel ls

# Rollback a deployment específico
vercel rollback [deployment-url]
```

### Rollback de Base de Datos

```bash
# Si hay migración problemática, revertir
npx prisma migrate resolve --rolled-back [migration-name]
```

---

## 8. Checklist Pre-Deploy

### Seguridad

- [ ] `JWT_SECRET` configurado (mínimo 32 caracteres)
- [ ] `DATABASE_URL` apunta a BD de producción
- [ ] Variables de Upstash configuradas
- [ ] HTTPS habilitado (automático en Vercel)

### Funcionalidad

- [ ] Build local exitoso (`npm run build`)
- [ ] Tests pasando (`npm run lint`)
- [ ] Migraciones aplicadas en BD producción
- [ ] Usuario admin creado

### Configuración

- [ ] Dominio configurado y DNS propagado
- [ ] Cloudinary configurado
- [ ] Mapbox token válido
- [ ] Resend configurado para emails

### Post-Deploy

- [ ] Verificar login funciona
- [ ] Verificar carga de mapas
- [ ] Verificar subida de imágenes
- [ ] Verificar envío de emails
- [ ] Revisar logs por errores

---

## 🔧 Troubleshooting

### Build Falla

```bash
# Limpiar cache y reinstalar
rm -rf node_modules .next
npm install
npm run build
```

### Error de Prisma

```bash
# Regenerar cliente
npx prisma generate
```

### Error de Conexión a BD

- Verificar que IP de Vercel esté en whitelist de Neon
- Verificar SSL mode en connection string

### Rate Limiting No Funciona

- Verificar variables UPSTASH_REDIS_*
- Verificar que Redis esté activo en Upstash dashboard

---

## 📞 Contactos

| Rol | Contacto |
|-----|----------|
| DevOps | devops@armados2go.com |
| Backend | backend@armados2go.com |
| Soporte | soporte@armados2go.com |

---

*Última actualización: Diciembre 2024*
