import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkSuperAdmin() {
  try {
    console.log("🔍 Verificando superadmin en PRD...");
    
    // Buscar específicamente el superadmin
    const superadmin = await prisma.usuario.findUnique({
      where: { email: "superadmin@armados2go.com" },
      select: { email: true, nombre: true, rol: true, activo: true, createdAt: true }
    });
    
    if (superadmin) {
      console.log("✅ Superadmin encontrado:");
      console.log("📧 Email:", superadmin.email);
      console.log("👤 Nombre:", superadmin.nombre);
      console.log("🎯 Rol:", superadmin.rol);
      console.log("🟢 Activo:", superadmin.activo);
      console.log("📅 Creado:", superadmin.createdAt);
    } else {
      console.log("❌ Superadmin NO encontrado");
      
      // Listar todos los admins
      const admins = await prisma.usuario.findMany({
        where: { rol: "ADMIN" },
        select: { email: true, nombre: true, rol: true }
      });
      
      console.log("📊 Admins existentes:", admins.length);
      admins.forEach(admin => {
        console.log(`- ${admin.email} (${admin.nombre})`);
      });
    }
    
  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : String(error));
  } finally {
    await prisma.$disconnect();
  }
}

checkSuperAdmin();
