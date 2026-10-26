import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditFromSession } from "@/lib/audit-logger";
import { crearMuebleSchema } from "@/lib/schemas/mueble.schemas";
import { getPaginationParams, buildPaginatedResponse } from "@/lib/pagination";

// GET - Listar muebles
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    // Solo se usa desde /admin/ordenes/nueva (ADMIN y SUPERVISOR); sin este
    // chequeo, cualquier rol autenticado -incluyendo ARMADOR- podía listar
    // el catálogo de muebles de todos los proyectos/retailers.
    if (!session || !["ADMIN", "SUPERVISOR"].includes(session.rol)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const proyectoId = searchParams.get("proyectoId");
    const pagination = getPaginationParams(searchParams);

    const where: Record<string, unknown> = {};
    if (proyectoId) where.proyectoId = proyectoId;

    if (session.rol === "SUPERVISOR") {
      const supervisorProyectos = await prisma.supervisorProyecto.findMany({
        where: { usuarioId: session.userId },
        select: { proyectoId: true },
      });
      const proyectoIdsPermitidos = supervisorProyectos.map((sp) => sp.proyectoId);

      if (proyectoId && !proyectoIdsPermitidos.includes(proyectoId)) {
        return NextResponse.json({ error: "No autorizado para este proyecto" }, { status: 403 });
      }

      where.proyectoId =
        proyectoId || { in: proyectoIdsPermitidos.length > 0 ? proyectoIdsPermitidos : ["__NINGUNO__"] };
    }

    const [muebles, total] = await Promise.all([
      prisma.mueble.findMany({
        where,
        include: {
          proyecto: { select: { nombreComercial: true } },
        },
        orderBy: { nombre: "asc" },
        take: pagination.limit,
        skip: pagination.skip,
      }),
      prisma.mueble.count({ where }),
    ]);

    return NextResponse.json(buildPaginatedResponse(muebles, total, pagination));
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