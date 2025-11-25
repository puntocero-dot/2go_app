import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withRateLimitAndValidation } from "@/lib/api-helpers";
import { IniciarTurnoSchema } from "@/lib/schemas/turno.schemas";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { logAuditFromSession } from "@/lib/audit-logger";

// POST - Iniciar turno y crear punto inicial
const handler = async (
  data: { latitud: number; longitud: number; descripcion?: string },
  request: NextRequest
) => {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { latitud, longitud, descripcion } = data;

    // Buscar armador del usuario
    const armador = await prisma.armador.findUnique({
      where: { usuarioId: session.userId },
    });

    if (!armador) {
      return NextResponse.json(
        { error: "Usuario no es un armador" },
        { status: 400 }
      );
    }

    // Verificar si ya tiene un turno activo
    const turnoActivo = await prisma.turno.findFirst({
      where: {
        armadorId: armador.id,
        estado: "ACTIVO",
      },
    });

    if (turnoActivo) {
      return NextResponse.json(
        { error: "Ya tienes un turno activo", turno: turnoActivo },
        { status: 400 }
      );
    }

    // Crear turno con punto inicial
    const turno = await prisma.turno.create({
      data: {
        armadorId: armador.id,
        estado: "ACTIVO",
        rutaPuntos: {
          create: {
            latitud,
            longitud,
            tipo: "INICIO",
            descripcion: descripcion || "Inicio de turno",
          },
        },
      },
      include: {
        rutaPuntos: true,
      },
    });

    // Actualizar ubicación actual del armador
    await prisma.armador.update({
      where: { id: armador.id },
      data: {
        ubicacionActualLat: latitud,
        ubicacionActualLng: longitud,
        ultimaActualizacionGPS: new Date(),
      },
    });

    // Auditar inicio de turno
    await logAuditFromSession({
      session,
      action: "START_SHIFT",
      resource: "turno",
      resourceId: turno.id,
      changes: {
        after: {
          armadorId: armador.id,
          latitud,
          longitud,
        },
      },
      request,
    });

    return NextResponse.json(turno);
  } catch (error) {
    console.error("Error iniciando turno:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
};

// Exportar con rate limiting y validación
export const POST = withRateLimitAndValidation(
  IniciarTurnoSchema,
  RATE_LIMITS.DEFAULT,
  (request) => {
    // Key: IP (ya que aún no sabemos el userId del armador)
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    return `iniciar-turno:${ip}`;
  },
  handler
);
