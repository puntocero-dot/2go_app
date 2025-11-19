import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Listar todos los proyectos
export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const proyectos = await prisma.proyecto.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            ordenes: true,
            muebles: true,
          },
        },
      },
    });

    return NextResponse.json({ proyectos });
  } catch (error) {
    console.error("Error obteniendo proyectos:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo proyecto
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || session.rol !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const { nombreComercial, tipoCliente, datosFacturacion } = body;

    if (!nombreComercial || !tipoCliente || !datosFacturacion) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    const proyecto = await prisma.proyecto.create({
      data: {
        nombreComercial,
        tipoCliente,
        datosFacturacion,
        activo: true,
      },
    });

    return NextResponse.json({ proyecto }, { status: 201 });
  } catch (error) {
    console.error("Error creando proyecto:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}