import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Obtener turno activo del usuario
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Buscar armador del usuario
    const armador = await prisma.armador.findUnique({
      where: { usuarioId: session.userId },
    });

    if (!armador) {
      return NextResponse.json({ turno: null });
    }

    // Buscar turno activo
    const turnoActivo = await prisma.turno.findFirst({
      where: {
        armadorId: armador.id,
        estado: "ACTIVO",
      },
      include: {
        rutaPuntos: {
          orderBy: { timestamp: "desc" },
          take: 1,
        },
      },
    });

    return NextResponse.json({ turno: turnoActivo });
  } catch (error) {
    console.error("Error obteniendo turno activo:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
