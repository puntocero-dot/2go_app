import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Listar turnos históricos de un armador
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id: armadorId } = await params;
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get("estado");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Verificar que el armador existe
    const armador = await prisma.armador.findUnique({
      where: { id: armadorId },
    });

    if (!armador) {
      return NextResponse.json(
        { error: "Armador no encontrado" },
        { status: 404 }
      );
    }

    // Verificar permisos
    const esArmador = armador.usuarioId === session.userId;
    const esAdminOSupervisor = session.rol === "ADMIN" || session.rol === "SUPERVISOR";

    if (!esArmador && !esAdminOSupervisor) {
      return NextResponse.json(
        { error: "No autorizado para ver estos turnos" },
        { status: 403 }
      );
    }

    // Construir filtros
    const where: any = { armadorId };
    if (estado) {
      where.estado = estado;
    }

    // Obtener turnos con conteo de puntos
    const [turnos, total] = await Promise.all([
      prisma.turno.findMany({
        where,
        include: {
          _count: {
            select: { rutaPuntos: true },
          },
        },
        orderBy: { inicioTurno: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.turno.count({ where }),
    ]);

    return NextResponse.json({
      turnos,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error obteniendo turnos:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
