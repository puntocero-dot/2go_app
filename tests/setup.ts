// Setup global para tests — configura variables de entorno minimas
process.env.JWT_SECRET = "test-secret-only-for-vitest-do-not-use-in-production";
// NODE_ENV es read-only en TypeScript — Vitest lo setea automaticamente como "test"
