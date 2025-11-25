import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withRateLimitAndValidation } from "@/lib/api-helpers";
import { FinalizarTurnoSchema } from "@/lib/schemas/turno.schemas";
import { RATE_LIMITS } from "@/lib/rate-limit";

// POST - Finalizar turno y crear punto final
const handler = async (
  data: { latitud: number; longitud: number; descripcion?: string },
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id: turnoId } = params;
    const { latitud, longitud, descripcion } = data;

    // Verificar que el turno existe y está activo
    const turno = await prisma.turno.findUnique({
      where: { id: turnoId },
      include: { armador: true },
    });

    if (!turno) {
      return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
    }

    if (turno.estado !== "ACTIVO") {
      return NextResponse.json(
        { error: "El turno no está activo" },
        { status: 400 }
      );
    }

    // Verificar que el turno pertenece al usuario
    if (turno.armador.usuarioId !== session.userId) {
      return NextResponse.json(
        { error: "No autorizado para este turno" },
        { status: 403 }
      );
    }

    // Crear punto final y actualizar turno
    const turnoFinalizado = await prisma.turno.update({
      where: { id: turnoId },
      data: {
        estado: "FINALIZADO",
        finTurno: new Date(),
        rutaPuntos: {
          create: {
            latitud,
            longitud,
            tipo: "FIN",
            descripcion: descripcion || "Fin de turno",
          },
        },
      },
      include: {
        rutaPuntos: {
          orderBy: { timestamp: "asc" },
        },
      },
    });

    return NextResponse.json(turnoFinalizado);
  } catch (error) {
    console.error("Error finalizando turno:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
};

// Exportar con rate limiting y validación
export const POST = withRateLimitAndValidation(
  FinalizarTurnoSchema,
  RATE_LIMITS.DEFAULT,
  (request) => {
    // Key: turnoId del path
    const url = new URL(request.url);
    const turnoId = url.pathname.split("/")[3]; // /api/turnos/[id]/finalizar
    return `finalizar-turno:${turnoId}`;
  },
  handler
);
