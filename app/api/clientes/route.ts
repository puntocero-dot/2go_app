import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Listar clientes
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

    const clientes = await prisma.usuarioFinal.findMany({
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

    return NextResponse.json({ clientes });
  } catch (error) {
    console.error("Error obteniendo clientes:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST - Crear cliente
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || !["ADMIN", "SUPERVISOR"].includes(session.rol)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const {
      nombre,
      telefono,
      email,
      direccionCompleta,
      municipio,
      departamento,
      proyectoId,
      prioridad,
    } = body;

    if (!nombre || !telefono || !direccionCompleta || !municipio || !departamento || !proyectoId) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    const cliente = await prisma.usuarioFinal.create({
      data: {
        nombre,
        telefono,
        email: email || null,
        direccionCompleta,
        municipio,
        departamento,
        proyectoId,
        prioridad: prioridad || "NORMAL",
      },
    });

    return NextResponse.json({ cliente }, { status: 201 });
  } catch (error) {
    console.error("Error creando cliente:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}