import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditFromSession } from "@/lib/audit-logger";
import { crearMuebleSchema } from "@/lib/schemas/mueble.schemas";

// GET - Listar muebles
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const proyectoId = searchParams.get("proyectoId");

    const where: Record<string, string> = {};
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

    const rawBody = await request.json();
    const parsed = crearMuebleSchema.safeParse(rawBody);

    if (!parsed.success) {
      const detalles = parsed.error.flatten();
      return NextResponse.json(
        { error: "Datos inválidos", detalles },
        { status: 400 }
      );
    }

    const { nombre, tamano, descripcion, proyectoId } = parsed.data;

    const mueble = await prisma.mueble.create({
      data: {
        nombre,
        tamano,
        descripcion: descripcion || null,
        proyectoId,
      },
    });

    await logAuditFromSession({
      session,
      action: "CREATE_FURNITURE",
      resource: "mueble",
      resourceId: mueble.id,
      changes: {
        after: {
          nombre: mueble.nombre,
          tamano: mueble.tamano,
          proyectoId: mueble.proyectoId,
        },
      },
      request,
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