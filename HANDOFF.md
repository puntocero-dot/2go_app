# Handoff

## Estado del repo
- Rama: `master`
- git status: había cambios en `components/MapaRutaArmador.tsx` y `app/admin/reportes/bi-dashboard/page.tsx` (se incluyen en este handoff). Se mostraba "ahead 1" antes de push.

## Cambios locales relevantes
1) Mapas (histórico de rutas)
- `components/MapaRutaArmador.tsx`: ahora acepta tanto `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` como `NEXT_PUBLIC_MAPBOX_TOKEN` para evitar mapas grises cuando la variable se llama `_ACCESS_TOKEN`.

2) BI Dashboard
- `app/admin/reportes/bi-dashboard/page.tsx`: ajustes recientes en KPIs/filters (filtrar por creación o completado; promedios solo con completadas en rango; tiempos formateados en segundos; simplificación de tiempos por estado). Estos cambios estaban en el working tree y se incluirán en el commit.

## Pendientes críticos (no resueltos aún)
- Mapas en admin (turnos/rutas/mapa) verificar tras CSP y token; confirmar que cargan tiles y workers.
- Reporte de tiempos: rango obligatorio y datos coherentes en todas las vistas/export.
- Rutas mostrando turnos: revisar `/api/armadores/[id]/turnos` y UI de rutas.
- Estado de usuario que cambia a offline al editar perfil.
- Limpiar rutas/enlaces obsoletos (ej. “reportes” legacy) antes del deploy.
- No se ha hecho deploy; política: agrupar en un batch final.

## Notas de entorno
- Mapbox: usar `NEXT_PUBLIC_MAPBOX_TOKEN` o `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`.
- CSP relajada en `lib/security-headers.ts` para Mapbox (tiles, workers, blobs) y vercel.live.

## Tests
- No se ejecutaron tests en esta sesión.

## Próximos pasos sugeridos
- Confirmar mapas cargando en admin (turnos y rutas) con el token configurado.
- Validar BI Dashboard y reporte de tiempos con rangos de fechas reales en PDR.
- Revisar flujo de edición de perfil para evitar estado offline inesperado.
- Luego hacer deploy único con todo el batch.
