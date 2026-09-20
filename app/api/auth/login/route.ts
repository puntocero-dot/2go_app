import { NextRequest, NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth";
import { withRateLimitAndValidation } from "@/lib/api-helpers";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { LoginSchema, LoginInput } from "@/lib/schemas/auth.schemas";
import { logAudit, logAuditFromSession } from "@/lib/audit-logger";

/**
 * Inicia (o reutiliza) el turno del armador y registra el login en auditoría.
 * Se ejecuta en `after()` (post-respuesta): nada de esto lo lee el cliente
 * en la respuesta del login (el frontend solo usa `user.rol` para redirigir),
 * así que no hay razón para que el usuario espere estas ~3-4 queries extra
 * antes de ver la pantalla siguiente.
 */
async function finalizarLoginEnBackground(
  usuario: { id: string; email: string; nombre: string; rol: string },
  request: NextRequest
) {
  let turnoId: string | null = null;

  if (usuario.rol === "ARMADOR") {
    try {
      const armador = await prisma.armador.findUnique({
        where: { usuarioId: usuario.id },
        include: {
          turnos: {
            where: { estado: "ACTIVO" },
            orderBy: { inicioTurno: "desc" },
            take: 1,
          },
        },
      });

      if (armador) {
        if (armador.turnos.length > 0) {
          turnoId = armador.turnos[0].id;
        } else {
          await prisma.turno.updateMany({
            where: { armadorId: armador.id, estado: "ACTIVO" },
            data: { estado: "FINALIZADO", finTurno: new Date() },
          });

          const nuevoTurno = await prisma.turno.create({
            data: {
              armadorId: armador.id,
              estado: "ACTIVO",
              inicioTurno: new Date(),
            },
          });
          turnoId = nuevoTurno.id;
        }
      }
    } catch (error) {
      console.error("Error creando turno automático:", error);
    }
  }

  await logAuditFromSession({
    session: {
      userId: usuario.id,
      nombre: usuario.nombre,
      rol: usuario.rol,
    },
    action: "LOGIN",
    resource: "auth",
    resourceId: usuario.id,
    metadata: { email: usuario.email, turnoId },
    request,
  });
}

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
      await logAudit({
        userId: "ANONYMOUS",
        userName: "Anon",
        userRole: "ANON",
        action: "FAILED_LOGIN",
        resource: "auth",
        metadata: { email },
        request,
        status: "FAILED",
        errorMsg: "USER_NOT_FOUND",
      });
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    // Verificar contraseña
    const isValidPassword = await verifyPassword(password, usuario.password);

    if (!isValidPassword) {
      await logAudit({
        userId: usuario.id,
        userName: usuario.nombre,
        userRole: usuario.rol,
        action: "FAILED_LOGIN",
        resource: "auth",
        resourceId: usuario.id,
        metadata: { email },
        request,
        status: "FAILED",
        errorMsg: "INVALID_PASSWORD",
      });
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    // Verificar que el usuario esté activo
    if (!usuario.activo) {
      await logAudit({
        userId: usuario.id,
        userName: usuario.nombre,
        userRole: usuario.rol,
        action: "FAILED_LOGIN",
        resource: "auth",
        resourceId: usuario.id,
        metadata: { email },
        request,
        status: "BLOCKED",
        errorMsg: "USER_INACTIVE",
      });
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

    // Cambiar estado de loggeo a ACTIVO automáticamente. No bloquea la
    // respuesta: el cliente solo necesita el rol para redirigir.
    const estadoLoggeoUpdate = prisma.usuario
      .update({
        where: { id: usuario.id },
        data: { estadoLoggeo: "ACTIVO" },
      })
      .catch((error) => {
        console.error("Error actualizando estadoLoggeo en login:", error);
      });

    // Iniciar turno (si es ARMADOR) y registrar auditoría después de responder:
    // ninguno de estos datos lo usa el frontend para decidir la redirección.
    after(async () => {
      await estadoLoggeoUpdate;
      await finalizarLoginEnBackground(usuario, request);
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