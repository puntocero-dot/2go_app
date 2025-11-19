import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Listar muebles
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const proyectoId = searchParams.get("proyectoId");

    const where: any = {};
    if (proyectoId) where.proyectoId = proyectoId;

    const muebles = await prisma.mueble.findMany({
      where,
      include: {
        proyecto: {
          select: {
            nombreComercial: true,
          },
        },
      },
      orderBy: { nombre: "asc" },
    });

    return NextResponse.json({ muebles });
  } catch (error) {
    console.error("Error obteniendo muebles:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST - Crear mueble
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || session.rol !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const { nombre, tamano, descripcion, proyectoId } = body;

    if (!nombre || !tamano || !proyectoId) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    const mueble = await prisma.mueble.create({
      data: {
        nombre,
        tamano,
        descripcion,
        proyectoId,
      },
    });

    return NextResponse.json({ mueble }, { status: 201 });
  } catch (error) {
    console.error("Error creando mueble:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}