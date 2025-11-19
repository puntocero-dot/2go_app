import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  try {
    console.log("🔍 Probando conexión a la base de datos...");
    console.log("📍 URL:", process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'));
    
    await prisma.$connect();
    console.log("✅ Conexión exitosa!");
    
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log("📊 Versión de PostgreSQL:", result);
    
  } catch (error) {
    console.error("❌ Error de conexión:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();