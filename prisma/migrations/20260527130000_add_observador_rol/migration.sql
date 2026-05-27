-- Añade el valor OBSERVADOR al enum RolUsuario.
-- Personal interno con acceso de solo lectura a las órdenes (ver detalle,
-- listado, sin permitir edición ni asignación). Pensado para back-office
-- de monitoreo (~20+ usuarios concurrentes).
--
-- NOTA: ALTER TYPE ADD VALUE no puede ejecutarse dentro de una transacción
-- en PostgreSQL. Prisma migrate aplica cada statement individualmente, así
-- que esto funciona sin BEGIN/COMMIT explícitos.

ALTER TYPE "RolUsuario" ADD VALUE IF NOT EXISTS 'OBSERVADOR';
