import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withValidation } from "@/lib/api-helpers";
import { logAuditFromSession } from "@/lib/audit-logger";
import {
  CrearProyectoSchema,
  CrearProyectoInput,
} from "@/lib/schemas/proyecto.schemas";

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
const crearProyectoHandler = async (
  data: CrearProyectoInput,
  request: NextRequest
) => {
  try {
    const session = await getSession();

    if (!session || session.rol !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const proyecto = await prisma.proyecto.create({
      data: {
        nombreComercial: data.nombreComercial,
        tipoCliente: data.tipoCliente,
        datosFacturacion: data.datosFacturacion,
        activo: true,
      },
    });

    await logAuditFromSession({
      session,
      action: "CREATE_PROJECT",
      resource: "proyecto",
      resourceId: proyecto.id,
      changes: {
        after: {
          nombreComercial: proyecto.nombreComercial,
          tipoCliente: proyecto.tipoCliente,
          activo: proyecto.activo,
        },
      },
      request,
    });

    return NextResponse.json({ proyecto }, { status: 201 });
  } catch (error) {
    console.error("Error creando proyecto:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
};

export const POST = withValidation(CrearProyectoSchema, crearProyectoHandler);