# Guía de Migraciones Seguras - Armados 2GO

## ⚠️ REGLA DE ORO

**NUNCA ejecutes `npx prisma migrate dev` o `npx prisma migrate reset` directamente.**

Usa siempre los scripts seguros del proyecto.

---

## Scripts Disponibles

| Comando | Uso | Seguro en Prod |
|---------|-----|----------------|
| `npm run db:migrate:dev` | Crear y aplicar migraciones en desarrollo | ❌ Bloqueado |
| `npm run db:migrate:deploy` | Aplicar migraciones existentes | ✅ Sí |
| `npm run db:migrate:status` | Ver estado de migraciones | ✅ Sí |
| `npm run db:push` | Sync schema sin migración (dev only) | ❌ Bloqueado |
| `npm run db:studio` | Abrir Prisma Studio | ✅ Sí |

---

## Flujo de Trabajo para Migraciones

### 1. Desarrollo Local

```bash
# 1. Asegúrate de que .env apunta a tu DB local
DATABASE_URL="postgresql://user:pass@localhost:5432/armados_dev"

# 2. Modifica prisma/schema.prisma

# 3. Crea la migración
npm run db:migrate:dev -- nombre_descriptivo

# 4. Verifica que funciona
npm run dev
```

### 2. Subir a Producción

```bash
# 1. Commit de la migración
git add prisma/migrations
git commit -m "feat: add migration for X"

# 2. Push a master
git push origin master

# 3. Vercel ejecutará automáticamente:
#    prisma generate && prisma migrate deploy && next build
```

---

## Configuración de Entornos

### Desarrollo (.env.local)
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/armados_dev"
```

### Producción (Vercel Environment Variables)
```env
DATABASE_URL="postgresql://...@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
```

---

## ¿Qué hace cada comando de Prisma?

| Comando | Qué hace | Peligro |
|---------|----------|---------|
| `migrate dev` | Crea migración + aplica + puede resetear | 🔴 ALTO |
| `migrate reset` | BORRA TODO y re-aplica migraciones | 🔴 CRÍTICO |
| `migrate deploy` | Solo aplica migraciones pendientes | 🟢 SEGURO |
| `db push` | Sync schema sin crear migración | 🟡 MEDIO |
| `generate` | Regenera Prisma Client | 🟢 SEGURO |

---

## Protecciones Implementadas

### 1. Script safe-migrate.js
- Detecta si DATABASE_URL apunta a producción
- Bloquea `migrate dev`, `migrate reset` y `db push` en producción
- Solo permite `migrate deploy` y `migrate status` en producción

### 2. Detección de Producción
El script detecta producción si la URL contiene:
- supabase.com, neon.tech, planetscale.com, railway.app
- Palabras: prod, production, live, main
- Cualquier host que NO sea localhost/127.0.0.1

### 3. Vercel Build
El build de Vercel ejecuta `prisma migrate deploy` automáticamente, que es seguro porque:
- Solo aplica migraciones que ya existen en `prisma/migrations/`
- Nunca crea nuevas migraciones
- Nunca resetea la base de datos

---

## Solución de Problemas

### "Drift detected" en desarrollo
```bash
# Si tu DB local está desincronizada:
# 1. Verifica que estás en desarrollo
echo $DATABASE_URL

# 2. Si es localhost, puedes resetear:
npx prisma migrate reset
```

### Migración falló en producción
```bash
# 1. Ver estado
npm run db:migrate:status

# 2. Si hay migraciones pendientes con errores:
#    - Revisa los logs de Vercel
#    - Corrige el schema
#    - Crea nueva migración que arregle el problema
```

### Necesito hacer cambio urgente en producción
```bash
# NUNCA hagas esto:
# ❌ npx prisma db push (en producción)
# ❌ npx prisma migrate dev (en producción)
# ❌ Modificar la DB directamente

# SIEMPRE haz esto:
# ✅ Crea migración en desarrollo
# ✅ Prueba localmente
# ✅ Push a master
# ✅ Deja que Vercel aplique con migrate deploy
```

---

## Checklist Pre-Migración

- [ ] ¿Mi .env apunta a localhost?
- [ ] ¿Hice backup de datos importantes?
- [ ] ¿La migración es reversible o tengo plan B?
- [ ] ¿Probé la migración en desarrollo primero?
- [ ] ¿El nombre de la migración es descriptivo?

---

## Contacto de Emergencia

Si accidentalmente ejecutaste algo peligroso en producción:
1. **NO ENTRES EN PÁNICO**
2. Revisa los logs de Supabase/Vercel
3. Si hay backup automático, considera restaurar
4. Documenta qué pasó para evitar repetirlo
