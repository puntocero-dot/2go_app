import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";

/**
 * ENDPOINT TEMPORAL DE DEBUG
 * Eliminar después de diagnosticar el problema
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    console.log("🔍 DEBUG LOGIN - Iniciando...");
    console.log("📧 Email recibido:", email);
    console.log("🔑 Password recibido:", password ? "***" : "VACÍO");

    // 1. Verificar conexión a DB
    try {
      await prisma.$connect();
      console.log("✅ Conexión a DB exitosa");
    } catch (dbError) {
      console.error("❌ Error conectando a DB:", dbError);
      return NextResponse.json({
        error: "DB_CONNECTION_ERROR",
        details: String(dbError),
      }, { status: 500 });
    }

    // 2. Buscar usuario
    let usuario;
    try {
      usuario = await prisma.usuario.findUnique({
        where: { email },
      });
      console.log("👤 Usuario encontrado:", usuario ? "SÍ" : "NO");
      if (usuario) {
        console.log("   - ID:", usuario.id);
        console.log("   - Nombre:", usuario.nombre);
        console.log("   - Rol:", usuario.rol);
        console.log("   - Activo:", usuario.activo);
        console.log("   - Password hash existe:", usuario.password ? "SÍ" : "NO");
      }
    } catch (userError) {
      console.error("❌ Error buscando usuario:", userError);
      return NextResponse.json({
        error: "USER_QUERY_ERROR",
        details: String(userError),
      }, { status: 500 });
    }

    if (!usuario) {
      return NextResponse.json({
        error: "USER_NOT_FOUND",
        email,
      }, { status: 404 });
    }

    // 3. Verificar contraseña
    try {
      const isValidPassword = await verifyPassword(password, usuario.password);
      console.log("🔐 Password válido:", isValidPassword ? "SÍ" : "NO");
      
      return NextResponse.json({
        success: true,
        debug: {
          userExists: true,
          userId: usuario.id,
          userActive: usuario.activo,
          passwordValid: isValidPassword,
          userRole: usuario.rol,
        },
      });
    } catch (passwordError) {
      console.error("❌ Error verificando password:", passwordError);
      return NextResponse.json({
        error: "PASSWORD_VERIFICATION_ERROR",
        details: String(passwordError),
      }, { status: 500 });
    }

  } catch (error) {
    console.error("❌ Error general:", error);
    return NextResponse.json({
      error: "GENERAL_ERROR",
      details: String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
