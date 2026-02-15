import { PrismaClient } from "@prisma/client";

const PROD_DATABASE_URL = "postgresql://postgres.fgpfycmdehoowsyrmbrh:Santi2301r%24@aws-1-us-east-1.pooler.supabase.com:5432/postgres";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: PROD_DATABASE_URL,
    },
  },
});

async function checkDatabase() {
  try {
    console.log("🔍 Verificando base de datos de PRODUCCIÓN...\n");
    
    const userCount = await prisma.usuario.count();
    console.log(`📊 Total usuarios: ${userCount}`);
    
    const users = await prisma.usuario.findMany({
      select: { id: true, email: true, rol: true, activo: true }
    });
    
    console.log("\n👥 Usuarios encontrados:");
    users.forEach(u => {
      console.log(`   - ${u.email} (${u.rol}) - ${u.activo ? '✅ Activo' : '❌ Inactivo'}`);
    });
    
    // Verificar tablas
    const proyectos = await prisma.proyecto.count();
    const ordenes = await prisma.orden.count();
    const armadores = await prisma.armador.count();
    
    console.log("\n📈 Conteos:");
    console.log(`   - Proyectos: ${proyectos}`);
    console.log(`   - Órdenes: ${ordenes}`);
    console.log(`   - Armadores: ${armadores}`);
    
    // Verificar tabla audit_logs
    try {
      const auditLogs = await prisma.auditLog.count();
      console.log(`   - AuditLogs: ${auditLogs} ✅`);
    } catch (e: any) {
      console.log(`   - AuditLogs: ❌ ERROR - ${e.message}`);
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
