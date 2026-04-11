-- ============================================================
-- Enable Row-Level Security (RLS) en todas las tablas
-- Prisma conecta via service_role que bypasea RLS por defecto.
-- Esto protege contra acceso directo via PostgREST (anon/authenticated).
--
-- NOTA: CREATE POLICY no admite IF NOT EXISTS en PostgreSQL.
-- Se usa DROP POLICY IF EXISTS antes de cada CREATE POLICY.
-- Es seguro ejecutar multiples veces (idempotente).
-- ============================================================

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'usuarios',
    'armadores',
    'horarios_programados',
    'proyectos',
    'supervisor_proyectos',
    'reglas_cobro',
    'rangos_volumen',
    'cobros_distancia',
    'penalizaciones',
    'muebles',
    'usuarios_finales',
    'ordenes',
    'registros_estado',
    'archivos_ordenes',
    'penalizaciones_aplicadas',
    'configuracion_sistema',
    'logs_actividad',
    'notificaciones',
    'notificaciones_sistema',
    'notificaciones_usuario',
    'configuracion_facturacion',
    'turnos',
    'ruta_puntos',
    'audit_logs',
    'configuracion_geomaps'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP

    -- 1. Habilitar RLS en la tabla
    EXECUTE format('ALTER TABLE IF EXISTS %I ENABLE ROW LEVEL SECURITY', tbl);

    -- 2. Forzar RLS incluso para el owner (seguridad adicional)
    EXECUTE format('ALTER TABLE IF EXISTS %I FORCE ROW LEVEL SECURITY', tbl);

    -- 3. Politica service_role: acceso total (usado por Prisma via DATABASE_URL)
    --    DROP IF EXISTS primero para que sea idempotente
    EXECUTE format('DROP POLICY IF EXISTS "service_role_full_access" ON %I', tbl);
    EXECUTE format(
      'CREATE POLICY "service_role_full_access" ON %I FOR ALL TO service_role USING (true) WITH CHECK (true)',
      tbl
    );

    -- 4. Bloquear acceso directo via PostgREST para rol anon
    EXECUTE format('DROP POLICY IF EXISTS "block_anon_access" ON %I', tbl);
    EXECUTE format(
      'CREATE POLICY "block_anon_access" ON %I FOR ALL TO anon USING (false)',
      tbl
    );

    -- 5. Bloquear acceso directo via PostgREST para rol authenticated
    EXECUTE format('DROP POLICY IF EXISTS "block_authenticated_access" ON %I', tbl);
    EXECUTE format(
      'CREATE POLICY "block_authenticated_access" ON %I FOR ALL TO authenticated USING (false)',
      tbl
    );

    RAISE NOTICE 'RLS habilitado correctamente en tabla: %', tbl;
  END LOOP;

  RAISE NOTICE '=== RLS activado en % tablas ===', array_length(tables, 1);
END $$;
