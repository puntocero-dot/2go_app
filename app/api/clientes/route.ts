import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditFromSession } from "@/lib/audit-logger";
import { crearClienteSchema } from "@/lib/schemas/cliente.schemas";
import { getPaginationParams, buildPaginatedResponse } from "@/lib/pagination";

// GET - Listar clientes
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    // Solo se usa desde /admin/ordenes/nueva (ADMIN y SUPERVISOR); sin este
    // chequeo, cualquier rol autenticado -incluyendo ARMADOR- podía listar
    // nombre/teléfono/dirección de los clientes de todos los proyectos.
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

    const [clientes, total] = await Promise.all([
      prisma.usuarioFinal.findMany({
        where,
        include: {
          proyecto: { select: { nombreComercial: true } },
        },
        orderBy: { nombre: "asc" },
        take: pagination.limit,
        skip: pagination.skip,
      }),
      prisma.usuarioFinal.count({ where }),
    ]);

    return NextResponse.json(buildPaginatedResponse(clientes, total, pagination));
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

    const rawBody = await request.json();
    const parsed = crearClienteSchema.safeParse(rawBody);

    if (!parsed.success) {
      const detalles = parsed.error.flatten();
      return NextResponse.json(
        { error: "Datos inválidos", detalles },
        { status: 400 }
      );
    }

    const {
      nombre,
      telefono,
      email,
      direccionCompleta,
      municipio,
      departamento,
      proyectoId,
      prioridad,
    } = parsed.data;

    const cliente = await prisma.usuarioFinal.create({
      data: {
        nombre,
        telefono,
        email: email || null,
        direccionCompleta,
        municipio,
        departamento,
        proyectoId,
        prioridad,
      },
    });

    await logAuditFromSession({
      session,
      action: "CREATE_CLIENT",
      resource: "cliente",
      resourceId: cliente.id,
      changes: {
        after: {
          nombre: cliente.nombre,
          telefono: cliente.telefono,
          proyectoId: cliente.proyectoId,
        },
      },
      request,
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