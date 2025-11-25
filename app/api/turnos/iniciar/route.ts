import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Iniciar turno y crear punto inicial
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const { latitud, longitud, descripcion } = body;

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

    // Buscar armador del usuario
    const armador = await prisma.armador.findUnique({
      where: { usuarioId: session.userId },
    });

    if (!armador) {
      return NextResponse.json(
        { error: "Usuario no es un armador" },
        { status: 400 }
      );
    }

    // Verificar si ya tiene un turno activo
    const turnoActivo = await prisma.turno.findFirst({
      where: {
        armadorId: armador.id,
        estado: "ACTIVO",
      },
    });

    if (turnoActivo) {
      return NextResponse.json(
        { error: "Ya tienes un turno activo", turno: turnoActivo },
        { status: 400 }
      );
    }

    // Crear turno con punto inicial
    const turno = await prisma.turno.create({
      data: {
        armadorId: armador.id,
        estado: "ACTIVO",
        rutaPuntos: {
          create: {
            latitud,
            longitud,
            tipo: "INICIO",
            descripcion: descripcion || "Inicio de turno",
          },
        },
      },
      include: {
        rutaPuntos: true,
      },
    });

    // Actualizar ubicación actual del armador
    await prisma.armador.update({
      where: { id: armador.id },
      data: {
        ubicacionActualLat: latitud,
        ubicacionActualLng: longitud,
        ultimaActualizacionGPS: new Date(),
      },
    });

    return NextResponse.json(turno);
  } catch (error) {
    console.error("Error iniciando turno:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
