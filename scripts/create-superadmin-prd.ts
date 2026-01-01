import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/auth";

// URL de producción hardcodeada para evitar problemas con .env
const PROD_DATABASE_URL = "postgresql://postgres.fgpfycmdehoowsyrmbrh:Santi2301r%24@aws-1-us-east-1.pooler.supabase.com:5432/postgres";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: PROD_DATABASE_URL,
    },
  },
});

async function createSuperAdminProduction() {
  try {
    console.log("🔧 Creando Super Admin en Producción...");
    console.log("📍 Base de datos: aws-1-us-east-1.pooler.supabase.com (PRD)");

    // Verificar si ya existe
    const existingSuperAdmin = await prisma.usuario.findUnique({
      where: { email: "superadmin@armados2go.com" },
    });

    if (existingSuperAdmin) {
      console.log("⚠️  El superadmin ya existe en PRD. Actualizando contraseña...");
      
      const newPassword = await hashPassword("admin123");
      await prisma.usuario.update({
        where: { email: "superadmin@armados2go.com" },
        data: { 
          password: newPassword,
          activo: true,
        },
      });
      
      console.log("✅ Superadmin actualizado correctamente en PRD");
    } else {
      // Crear nuevo superadmin
      const superadminPassword = await hashPassword("admin123");
      
      const superadmin = await prisma.usuario.create({
        data: {
          email: "superadmin@armados2go.com",
          password: superadminPassword,
          nombre: "Super Administrador",
          telefono: "7777-8888",
          rol: "ADMIN",
          activo: true,
        },
      });

      console.log("✅ Superadmin creado en PRD:", superadmin.email);
    }

    console.log("📧 Email: superadmin@armados2go.com");
    console.log("🔑 Contraseña: admin123");
    console.log("🎯 Rol: ADMIN");
    console.log("🌐 Ambiente: PRODUCCIÓN");

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdminProduction();
