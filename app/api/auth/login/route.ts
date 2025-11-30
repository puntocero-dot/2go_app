import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth";
import { withRateLimitAndValidation } from "@/lib/api-helpers";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { LoginSchema, LoginInput } from "@/lib/schemas/auth.schemas";

const loginHandler = async (data: LoginInput, request: NextRequest) => {
  try {
    const { email, password } = data;

    // Validar campos
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña son requeridos" },
        { status: 400 }
      );
    }

    // Buscar usuario
    const usuario = await prisma.usuario.findUnique({
      where: { email },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    // Verificar contraseña
    const isValidPassword = await verifyPassword(password, usuario.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    // Verificar que el usuario esté activo
    if (!usuario.activo) {
      return NextResponse.json(
        { error: "Usuario inactivo" },
        { status: 403 }
      );
    }

    // Crear sesión
    await createSession({
      userId: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
};

export const POST = withRateLimitAndValidation(
  LoginSchema,
  RATE_LIMITS.AUTH,
  (request) => {
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
    return `auth:${ip}`;
  },
  loginHandler
);