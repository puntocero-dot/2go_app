import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/auth";

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    console.log("🔧 Creando Super Admin...");

    // Verificar si ya existe
    const existingSuperAdmin = await prisma.usuario.findUnique({
      where: { email: "superadmin@armados2go.com" },
    });

    if (existingSuperAdmin) {
      console.log("⚠️  El superadmin ya existe. Actualizando contraseña...");
      
      const newPassword = await hashPassword("admin123");
      await prisma.usuario.update({
        where: { email: "superadmin@armados2go.com" },
        data: { 
          password: newPassword,
          activo: true,
        },
      });
      
      console.log("✅ Superadmin actualizado correctamente");
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

      console.log("✅ Superadmin creado:", superadmin.email);
    }

    console.log("📧 Email: superadmin@armados2go.com");
    console.log("🔑 Contraseña: admin123");
    console.log("🎯 Rol: ADMIN");

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();
