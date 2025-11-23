import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/auth";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed de la base de datos...");

  // Crear usuario admin
  const adminPassword = await hashPassword("123456");
  
  const admin = await prisma.usuario.upsert({
    where: { email: "admin@armados2go.com" },
    update: {},
    create: {
      email: "admin@armados2go.com",
      password: adminPassword,
      nombre: "Administrador",
      telefono: "7777-7777",
      rol: "ADMIN",
      activo: true,
    },
  });

  console.log("✅ Usuario admin creado:", admin.email);
  console.log("📧 Email: admin@armados2go.com");
  console.log("🔑 Contraseña: 123456");

  // Crear usuario supervisor de ejemplo
  const supervisorPassword = await hashPassword("123456");
  
  const supervisor = await prisma.usuario.upsert({
    where: { email: "supervisor@armados2go.com" },
    update: {},
    create: {
      email: "supervisor@armados2go.com",
      password: supervisorPassword,
      nombre: "Supervisor Demo",
      telefono: "7777-7778",
      rol: "SUPERVISOR",
      activo: true,
    },
  });

  console.log("✅ Usuario supervisor creado:", supervisor.email);
  console.log("📧 Email: supervisor@armados2go.com");
  console.log("🔑 Contraseña: 123456");

  // Crear usuario armador de ejemplo
  const armadorPassword = await hashPassword("123456");
  
  const usuarioArmador = await prisma.usuario.upsert({
    where: { email: "armador@armados2go.com" },
    update: {},
    create: {
      email: "armador@armados2go.com",
      password: armadorPassword,
      nombre: "Armador Demo",
      telefono: "7777-7779",
      rol: "ARMADOR",
      activo: true,
    },
  });

  const armador = await prisma.armador.upsert({
    where: { usuarioId: usuarioArmador.id },
    update: {},
    create: {
      usuarioId: usuarioArmador.id,
      estado: "ACTIVO",
      habilidades: ["Muebles grandes", "Muebles pequeños"],
    },
  });

  console.log("✅ Usuario armador creado:", usuarioArmador.email);
  console.log("📧 Email: armador@armados2go.com");
  console.log("🔑 Contraseña: 123456");

  console.log("\n🎉 Seed completado exitosamente!");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });