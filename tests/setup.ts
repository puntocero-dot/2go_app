// Setup global para tests — configura variables de entorno minimas
process.env.JWT_SECRET = "test-secret-only-for-vitest-do-not-use-in-production";
// Requerido para instanciar PrismaClient (lib/prisma.ts) al importar módulos
// que lo arrastran indirectamente (ej. lib/geomaps-helpers.ts). No se usa una
// conexión real en los tests unitarios, solo evita el error de validación del constructor.
process.env.DATABASE_URL ??= "postgresql://user:password@localhost:5432/test_db";
// NODE_ENV es read-only en TypeScript — Vitest lo setea automaticamente como "test"
