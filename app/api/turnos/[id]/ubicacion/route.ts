import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withRateLimitAndValidation } from "@/lib/api-helpers";
import { GuardarUbicacionSchema } from "@/lib/schemas/turno.schemas";
import { RATE_LIMITS } from "@/lib/rate-limit";

// POST - Guardar punto GPS durante turno activo
const handler = async (
  data: { latitud: number; longitud: number; tipo?: string; descripcion?: string },
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id: turnoId } = await params;
    const { latitud, longitud, tipo, descripcion } = data;

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

    // Crear punto de ruta
    const punto = await prisma.rutaPunto.create({
      data: {
        turnoId,
        latitud,
        longitud,
        tipo: (tipo || "INTERMEDIO") as "INICIO" | "INTERMEDIO" | "PARADA" | "FIN",
        descripcion,
      },
    });

    // Actualizar ubicación actual del armador
    await prisma.armador.update({
      where: { id: turno.armadorId },
      data: {
        ubicacionActualLat: latitud,
        ubicacionActualLng: longitud,
        ultimaActualizacionGPS: new Date(),
      },
    });

    return NextResponse.json(punto);
  } catch (error) {
    console.error("Error guardando ubicación:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
};

// Exportar con rate limiting y validación
export const POST = withRateLimitAndValidation(
  GuardarUbicacionSchema,
  RATE_LIMITS.GPS_TRACKING,
  (request) => {
    // Key: turnoId del path
    const url = new URL(request.url);
    const turnoId = url.pathname.split("/")[3]; // /api/turnos/[id]/ubicacion
    return `gps:${turnoId}`;
  },
  handler
);
