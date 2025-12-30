# 📍 Sistema de Turnos - Explicación y Mejoras

## ¿Qué son los Turnos?

Los **Turnos** son sesiones de trabajo de los armadores que registran:
- **Inicio y fin** de su jornada laboral
- **Ruta GPS completa** durante el turno (puntos de ubicación)
- **Estado** del turno (ACTIVO, FINALIZADO, CANCELADO)

### Propósito Principal

1. **Tracking GPS**: Registrar el recorrido completo del armador durante su jornada
2. **Análisis de rutas**: Ver dónde estuvo, cuánto tiempo tomó, distancia recorrida
3. **Auditoría**: Verificar que el armador visitó las direcciones correctas
4. **Optimización**: Analizar patrones para mejorar asignaciones futuras

---

## 🔄 Flujo Actual

### 1. Inicio de Turno
Cuando un armador **inicia sesión en la PWA** y activa el GPS:
- Se crea un registro en la tabla `Turno` con estado `ACTIVO`
- Se registra la hora de inicio (`inicioTurno`)

### 2. Durante el Turno
Mientras el armador trabaja:
- La PWA envía ubicaciones GPS periódicamente (cada X minutos)
- Cada punto se guarda en la tabla `RutaPunto` asociado al turno activo
- Los puntos incluyen: latitud, longitud, timestamp, tipo (INICIO, INTERMEDIO, PARADA, FIN)

### 3. Fin de Turno
Cuando el armador **cierra sesión** o finaliza su jornada:
- Se actualiza el turno con `finTurno` (fecha/hora de cierre)
- El estado cambia a `FINALIZADO`

---

## 📊 Estructura de Datos

### Tabla `Turno`
```
- id: UUID único
- armadorId: ID del armador
- inicioTurno: Fecha/hora de inicio
- finTurno: Fecha/hora de fin (null si está activo)
- estado: ACTIVO | FINALIZADO | CANCELADO
```

### Tabla `RutaPunto`
```
- id: UUID único
- turnoId: ID del turno al que pertenece
- latitud: Coordenada GPS
- longitud: Coordenada GPS
- timestamp: Momento exacto del registro
- tipo: INICIO | INTERMEDIO | PARADA | FIN
- descripcion: Texto opcional (ej: "Llegada a cliente")
```

---

## ❌ Problema Actual

**En tu imagen 2**: "No hay turnos disponibles"

Esto significa que:
1. **Los armadores NO han iniciado turnos** desde la PWA
2. **O no tienen el GPS activado** en la app móvil
3. **O los turnos no se están creando correctamente**

---

## ✅ Soluciones y Mejoras

### Mejora 1: Iniciar Turno Automáticamente
**Problema**: Los armadores olvidan iniciar turno manualmente

**Solución**: Crear turno automáticamente cuando:
- El armador inicia sesión en la PWA
- Se le asigna la primera orden del día

### Mejora 2: Botón Manual de Inicio/Fin de Turno
**Problema**: No hay control explícito del turno

**Solución**: Agregar en la PWA del armador:
- Botón "Iniciar Turno" al inicio del día
- Botón "Finalizar Turno" al terminar
- Indicador visual del turno activo

### Mejora 3: Dashboard de Turnos para Admin
**Problema**: No se puede ver quién tiene turno activo

**Solución**: Crear vista en `/admin/turnos` que muestre:
- Turnos activos en tiempo real
- Armadores que NO han iniciado turno
- Historial de turnos del día/semana

### Mejora 4: Validación de Turnos
**Problema**: Órdenes sin turno asociado

**Solución**: 
- Requerir turno activo para tomar órdenes
- Alertar si un armador trabaja sin turno iniciado

### Mejora 5: Reportes de Turnos
**Problema**: No hay métricas de productividad

**Solución**: Agregar en reportes:
- Horas trabajadas por armador
- Distancia recorrida por turno
- Órdenes completadas por turno
- Tiempo promedio entre órdenes

---

## 🛠️ Implementación Propuesta

### Paso 1: Mejorar la PWA del Armador
Agregar componente de control de turno:
```tsx
// Botón para iniciar/finalizar turno
<TurnoControl 
  armadorId={user.id}
  onTurnoIniciado={() => iniciarGPS()}
  onTurnoFinalizado={() => detenerGPS()}
/>
```

### Paso 2: Crear Dashboard de Turnos
Nueva página `/admin/turnos` con:
- Lista de turnos activos
- Mapa con ubicación actual de cada armador
- Botón para forzar cierre de turno (emergencias)

### Paso 3: Mejorar Página de Rutas
En `/admin/rutas`:
- Filtrar por fecha (hoy, ayer, última semana)
- Mostrar métricas del turno:
  - Duración total
  - Distancia recorrida
  - Velocidad promedio
  - Paradas realizadas
- Exportar ruta a PDF/Excel

### Paso 4: Notificaciones
- Alertar a admin si armador NO inicia turno después de X tiempo
- Notificar a armador si olvida finalizar turno al final del día

---

## 📝 Recomendaciones Inmediatas

1. **Crear turnos de prueba** para poder ver la página de Rutas funcionando
2. **Capacitar a armadores** sobre la importancia de iniciar/finalizar turnos
3. **Hacer obligatorio** el turno activo para trabajar
4. **Agregar indicador visual** en la PWA del estado del turno

---

## 🎯 Próximos Pasos

¿Qué te gustaría implementar primero?

**A) Botón manual de Inicio/Fin de Turno en PWA del armador**
- Más control para el armador
- Fácil de implementar

**B) Dashboard de Turnos Activos para Admin**
- Ver quién está trabajando en tiempo real
- Monitoreo centralizado

**C) Crear turnos de prueba en la BD**
- Para poder probar la página de Rutas
- Ver cómo funciona el sistema

**D) Mejorar la página de Rutas con más filtros y métricas**
- Hacer más útil la visualización
- Agregar exportación de datos

---

## 💡 Nota Importante

El sistema de turnos es **fundamental** para:
- Cumplimiento laboral (registro de horas)
- Seguridad (saber dónde está cada armador)
- Optimización de rutas
- Resolución de disputas (prueba de visita)
- Análisis de productividad

**Sin turnos activos, la página de Rutas estará vacía.**
