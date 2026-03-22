import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Verificar puntos GPS guardados para un turno
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Obtener armador
    const armador = await prisma.armador.findUnique({
      where: { usuarioId: session.userId },
    });

    if (!armador) {
      return NextResponse.json({ error: "Armador no encontrado" }, { status: 404 });
    }

    // Obtener turno activo
    const turnoActivo = await prisma.turno.findFirst({
      where: {
        armadorId: armador.id,
        estado: "ACTIVO",
      },
      include: {
        rutaPuntos: {
          orderBy: { timestamp: "asc" },
        },
      },
    });

    if (!turnoActivo) {
      return NextResponse.json({
        turnoActivo: null,
        mensaje: "No hay turno activo",
      });
    }

    return NextResponse.json({
      turnoId: turnoActivo.id,
      estado: turnoActivo.estado,
      inicioTurno: turnoActivo.inicioTurno,
      finTurno: turnoActivo.finTurno,
      totalPuntos: turnoActivo.rutaPuntos.length,
      puntos: turnoActivo.rutaPuntos.map((p) => ({
        id: p.id,
        lat: p.latitud,
        lng: p.longitud,
        tipo: p.tipo,
        timestamp: p.timestamp,
      })),
    });
  } catch (error) {
    console.error("Error en debug GPS:", error);
    return NextResponse.json(
      { error: "Error interno del servidor", details: String(error) },
      { status: 500 }
    );
  }
}
