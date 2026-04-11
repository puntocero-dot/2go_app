import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

// GET - Obtener informacion de seguimiento publico (requiere token magico)
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params;
  const token = request.nextUrl.searchParams.get("token");

  // Requiere token para acceso publico
  if (!token) {
    return NextResponse.json(
      { error: "Token de seguimiento requerido" },
      { status: 401 }
    );
  }

  try {
    // Buscar por ID y validar que el token coincida
    const orden = await prisma.orden.findUnique({
      where: { id },
      select: {
        id: true,
        codigoReferenciaRetail: true,
        estado: true,
        fechaSolicitadaCliente: true,
        fechaAsignacion: true,
        fechaInicioArmado: true,
        fechaFinArmado: true,
        fechaCompletado: true,
        linkMagicoToken: true,
        mueble: {
          select: {
            nombre: true,
            descripcion: true,
          },
        },
        usuarioFinal: {
          select: {
            nombre: true,
            municipio: true,
          },
        },
        armador: {
          include: {
            usuario: {
              select: {
                nombre: true,
              },
            },
          },
        },
        registrosEstado: {
          orderBy: { timestamp: "desc" },
          select: {
            estadoCambiadoA: true,
            timestamp: true,
            comentario: true,
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

    // Validar token magico
    if (orden.linkMagicoToken !== token) {
      return NextResponse.json(
        { error: "Token de seguimiento invalido" },
        { status: 403 }
      );
    }

    // Remover el token de la respuesta
    const { linkMagicoToken: _, ...ordenSegura } = orden;

    return NextResponse.json({ orden: ordenSegura });
  } catch {
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}