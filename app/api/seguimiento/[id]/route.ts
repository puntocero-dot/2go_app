import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

// GET - Obtener información de seguimiento (sin autenticación)
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params;

  try {
    const orden = await prisma.orden.findUnique({
      where: { id },
      include: {
        mueble: {
          select: {
            nombre: true,
            descripcion: true,
          },
        },
        usuarioFinal: {
          select: {
            nombre: true,
            direccionCompleta: true,
            municipio: true,
            telefono: true,
          },
        },
        armador: {
          include: {
            usuario: {
              select: {
                nombre: true,
                telefono: true,
              },
            },
          },
        },
        registrosEstado: {
          orderBy: { timestamp: "desc" },
          include: {
            usuario: {
              select: {
                nombre: true,
              },
            },
          },
        },
      },
    });

    if (!orden) {
      return NextResponse.json(
        { error: "Orden no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ orden });
  } catch (error) {
    console.error("Error obteniendo orden:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}