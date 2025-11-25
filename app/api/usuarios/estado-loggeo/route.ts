import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT - Actualizar estado de loggeo del usuario
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const { estadoLoggeo } = body;

    const estadosValidos = ["ACTIVO", "LUNCH", "BREAK", "OFFLINE"];
    if (!estadosValidos.includes(estadoLoggeo)) {
      return NextResponse.json(
        { error: "Estado de loggeo inválido" },
        { status: 400 }
      );
    }

    const usuario = await prisma.usuario.update({
      where: { id: session.id },
      data: {
        estadoLoggeo,
      },
      select: {
        id: true,
        nombre: true,
        estadoLoggeo: true,
      },
    });

    return NextResponse.json(usuario);
  } catch (error) {
    console.error("Error actualizando estado de loggeo:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
