import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Obtener todos los puntos de ruta de un turno
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id: turnoId } = params;

    // Obtener turno con puntos de ruta
    const turno = await prisma.turno.findUnique({
      where: { id: turnoId },
      include: {
        armador: {
          include: {
            usuario: {
              select: {
                nombre: true,
                email: true,
              },
            },
          },
        },
        rutaPuntos: {
          orderBy: { timestamp: "asc" },
        },
      },
    });

    if (!turno) {
      return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
    }

    // Verificar permisos: solo el armador o admin/supervisor pueden ver
    const esArmador = turno.armador.usuarioId === session.userId;
    const esAdminOSupervisor = session.rol === "ADMIN" || session.rol === "SUPERVISOR";

    if (!esArmador && !esAdminOSupervisor) {
      return NextResponse.json(
        { error: "No autorizado para ver este turno" },
        { status: 403 }
      );
    }

    return NextResponse.json(turno);
  } catch (error) {
    console.error("Error obteniendo ruta:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
