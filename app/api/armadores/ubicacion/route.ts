import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Actualizar ubicación del armador
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || session.rol !== "ARMADOR") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const { lat, lng } = body;

    if (typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json(
        { error: "Coordenadas inválidas" },
        { status: 400 }
      );
    }

    // Buscar el armador del usuario
    const armador = await prisma.armador.findUnique({
      where: { usuarioId: session.userId },
    });

    if (!armador) {
      return NextResponse.json(
        { error: "Armador no encontrado" },
        { status: 404 }
      );
    }

    // Actualizar ubicación
    const armadorActualizado = await prisma.armador.update({
      where: { id: armador.id },
      data: {
        ubicacionActualLat: lat,
        ubicacionActualLng: lng,
        ultimaActualizacionGPS: new Date(),
      },
    });

    return NextResponse.json({
      message: "Ubicación actualizada",
      armador: {
        id: armadorActualizado.id,
        lat: armadorActualizado.ubicacionActualLat,
        lng: armadorActualizado.ubicacionActualLng,
        ultimaActualizacion: armadorActualizado.ultimaActualizacionGPS,
      },
    });
  } catch (error) {
    console.error("Error actualizando ubicación:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}