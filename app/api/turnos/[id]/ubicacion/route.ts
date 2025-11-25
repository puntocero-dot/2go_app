import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Guardar punto GPS durante turno activo
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id: turnoId } = params;
    const body = await request.json();
    const { latitud, longitud, tipo, descripcion } = body;

    // Validar coordenadas
    if (!latitud || !longitud) {
      return NextResponse.json(
        { error: "Latitud y longitud son requeridas" },
        { status: 400 }
      );
    }

    if (latitud < -90 || latitud > 90 || longitud < -180 || longitud > 180) {
      return NextResponse.json(
        { error: "Coordenadas inválidas" },
        { status: 400 }
      );
    }

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
        tipo: tipo || "INTERMEDIO",
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
}
