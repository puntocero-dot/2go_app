import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log("🔍 Probando conexión a PRD...");
    console.log("📍 URL:", process.env.DATABASE_URL?.split('@')[1]?.split('?')[0]);
    
    await prisma.$connect();
    console.log("✅ Conexión exitosa a PRD");
    
    // Probar consulta simple
    const result = await prisma.usuario.findMany({
      select: { email: true, nombre: true, rol: true },
      take: 5
    });
    
    console.log("📊 Usuarios encontrados:", result.length);
    result.forEach(user => {
      console.log(`- ${user.email} (${user.rol})`);
    });
    
  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : String(error));
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
