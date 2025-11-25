import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Finalizar turno y crear punto final
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
    const { latitud, longitud, descripcion } = body;

    // Validar coordenadas
    if (!latitud || !longitud) {
      return NextResponse.json(
        { error: "Latitud y longitud son requeridas" },
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
}
