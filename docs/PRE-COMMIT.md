# 🔒 Pre-Commit Hooks - Verificación Automática

Este proyecto usa **Husky** para ejecutar verificaciones automáticas antes de cada commit.

## 🎯 ¿Qué se verifica?

Cada vez que intentas hacer un commit, se ejecutan automáticamente:

### 1. **Type Check** (TypeScript)
```bash
npm run type-check
```
- Verifica que no haya errores de tipos
- Usa `tsc --noEmit` (no genera archivos, solo verifica)
- **Tiempo**: ~5-10 segundos

### 2. **Build Check** (Next.js)
```bash
npm run build
```
- Verifica que el código compile correctamente
- Detecta errores que solo aparecen en producción
- **Tiempo**: ~30-60 segundos

## ✅ Flujo Normal

```bash
# 1. Hacer cambios en el código
# 2. Agregar archivos
git add .

# 3. Intentar commit
git commit -m "feat: nueva funcionalidad"

# 4. Husky ejecuta automáticamente:
#    🔍 Ejecutando verificaciones pre-commit...
#    📝 1/2: Verificando tipos TypeScript...
#    ✅ Type-check pasó
#    🏗️  2/2: Verificando que el código compila...
#    ✅ Build pasó
#    ✨ Todas las verificaciones pasaron! Procediendo con el commit...

# 5. Si todo pasa, el commit se completa
# 6. Push a GitHub
git push
```

## ❌ Si hay errores

Si alguna verificación falla, el commit se **bloquea**:

```bash
git commit -m "feat: cambio con error"

# 🔍 Ejecutando verificaciones pre-commit...
# 📝 1/2: Verificando tipos TypeScript...
# 
# app/api/ejemplo/route.ts:10:5 - error TS2322: Type 'string' is not assignable to type 'number'.
# 
# ❌ Type-check falló. Por favor corrige los errores de tipo.
```

**Debes corregir los errores antes de poder hacer commit.**

## 🚀 Verificación Manual

Puedes ejecutar las verificaciones manualmente en cualquier momento:

```bash
# Solo type-check (rápido)
npm run type-check

# Build completo (más lento pero completo)
npm run build

# Ambos (lo que hace el pre-commit)
npm run type-check && npm run build
```

## ⚙️ Configuración

### Archivo de configuración
- `.husky/pre-commit` - Script que se ejecuta antes de cada commit

### Deshabilitar temporalmente (NO RECOMENDADO)

Si necesitas hacer un commit urgente sin verificaciones:

```bash
git commit -m "mensaje" --no-verify
```

⚠️ **ADVERTENCIA**: Esto puede romper el build de producción. Úsalo solo en emergencias.

## 🔧 Troubleshooting

### "Husky no se ejecuta"

```bash
# Reinstalar husky
npm install
npx husky install
```

### "Build muy lento"

El build puede tomar 30-60 segundos. Es normal. Esto previene errores en producción.

Si es muy lento, considera:
- Usar solo `type-check` en desarrollo
- Ejecutar `build` solo antes de push importante

### "Errores que no entiendo"

1. Ejecuta `npm run type-check` para ver errores de tipo
2. Ejecuta `npm run build` para ver errores de compilación
3. Lee el mensaje de error completo
4. Busca el archivo y línea mencionados

## 📚 Recursos

- [Husky Documentation](https://typicode.github.io/husky/)
- [TypeScript Compiler Options](https://www.typescriptlang.org/tsconfig)
- [Next.js Build](https://nextjs.org/docs/app/api-reference/next-cli#build)

---

**Última actualización**: Sprint 2 - Seguridad y Calidad
