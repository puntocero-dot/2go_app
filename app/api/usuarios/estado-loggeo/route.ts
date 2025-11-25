import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withRateLimitAndValidation } from "@/lib/api-helpers";
import { CambiarEstadoLoggeoSchema } from "@/lib/schemas/usuario.schemas";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { logAuditFromSession } from "@/lib/audit-logger";

// PUT - Actualizar estado de loggeo del usuario
const handler = async (
  data: { estadoLoggeo: string },
  request: NextRequest
) => {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { estadoLoggeo } = data;

    const usuario = await prisma.usuario.update({
      where: { id: session.userId },
      data: {
        estadoLoggeo,
      },
      select: {
        id: true,
        nombre: true,
        estadoLoggeo: true,
      },
    });

    // Auditar cambio de estado
    await logAuditFromSession({
      session,
      action: "CHANGE_LOGIN_STATUS",
      resource: "usuario",
      resourceId: session.userId,
      changes: {
        after: { estadoLoggeo },
      },
      request,
    });

    return NextResponse.json(usuario);
  } catch (error) {
    console.error("Error actualizando estado de loggeo:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
};

// Exportar con rate limiting y validación
export const PUT = withRateLimitAndValidation(
  CambiarEstadoLoggeoSchema,
  RATE_LIMITS.ESTADO_LOGGEO,
  (request) => {
    // Key: userId (extraído del header o IP como fallback)
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    return `estado:${ip}`;
  },
  handler
);
