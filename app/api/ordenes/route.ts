import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { asignarArmadorAutomatico } from "@/lib/auto-assign-armador";
import { withValidation } from "@/lib/api-helpers";
import { CrearOrdenSchema } from "@/lib/schemas/orden.schemas";
import { logAuditFromSession } from "@/lib/audit-logger";
import { getPaginationParams, buildPaginatedResponse } from "@/lib/pagination";

// GET - Listar órdenes con filtros
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const proyectoId = searchParams.get("proyectoId");
    const estado = searchParams.get("estado");
    const armadorId = searchParams.get("armadorId");
    const pagination = getPaginationParams(searchParams);

    const where: Record<string, unknown> = {};

    if (proyectoId) where.proyectoId = proyectoId;
    if (estado) where.estado = estado;
    if (armadorId) where.armadorId = armadorId;

    // Si es armador, solo ver sus ordenes
    if (session.rol === "ARMADOR") {
      const armador = await prisma.armador.findUnique({
        where: { usuarioId: session.userId },
      });
      if (armador) {
        where.armadorId = armador.id;
      }
    }

    const [ordenes, total] = await Promise.all([
      prisma.orden.findMany({
        where,
        include: {
          mueble: true,
          usuarioFinal: true,
          armador: {
            include: {
              usuario: {
                select: { nombre: true, telefono: true },
              },
            },
          },
          proyecto: {
            select: { nombreComercial: true },
          },
        },
        orderBy: { fechaCreacion: "desc" },
        take: pagination.limit,
        skip: pagination.skip,
      }),
      prisma.orden.count({ where }),
    ]);

    return NextResponse.json(buildPaginatedResponse(ordenes, total, pagination));
  } catch (error) {
    console.error("Error obteniendo ordenes:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST - Crear nueva orden
const crearOrdenHandler = async (
  data: {
    codigoReferenciaRetail: string;
    muebleId: string;
    usuarioFinalId: string;
    proyectoId: string;
    fechaSolicitadaCliente?: string;
    autoAsignar?: boolean;
    prioridad?: string;
  },
  request: NextRequest
) => {
  try {
    const session = await getSession();

    if (!session || !["ADMIN", "SUPERVISOR"].includes(session.rol)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const {
      codigoReferenciaRetail,
      muebleId,
      usuarioFinalId,
      proyectoId,
      fechaSolicitadaCliente,
      autoAsignar,
      prioridad,
    } = data;

    const prioridadValida = (prioridad || "NORMAL") as "VIP" | "URGENTE" | "MEDIA" | "NORMAL";

    // Crear la orden
    const orden = await prisma.orden.create({
      data: {
        codigoReferenciaRetail,
        muebleId,
        usuarioFinalId,
        proyectoId,
        fechaSolicitadaCliente: fechaSolicitadaCliente
          ? new Date(fechaSolicitadaCliente)
          : null,
        estado: "SIN_ASIGNAR",
        prioridad: prioridadValida,
      },
      include: {
        mueble: true,
        usuarioFinal: true,
        proyecto: true,
      },
    });

    // Auditar creación de orden
    await logAuditFromSession({
      session,
      action: "CREATE_ORDER",
      resource: "orden",
      resourceId: orden.id,
      changes: {
        after: {
          codigoReferenciaRetail,
          muebleId,
          usuarioFinalId,
          proyectoId,
          prioridad: prioridadValida,
        },
      },
      request,
    });

    // Si se solicita auto-asignación, buscar armador disponible
    if (autoAsignar) {
      const armadorAsignado = await asignarArmadorAutomatico(orden);
      
      if (armadorAsignado) {
        const ordenActualizada = await prisma.orden.update({
          where: { id: orden.id },
          data: {
            armadorId: armadorAsignado.id,
            estado: "ASIGNADO",
            fechaAsignacion: new Date(),
          },
          include: {
            mueble: true,
            usuarioFinal: true,
            armador: {
              include: {
                usuario: true,
              },
            },
          },
        });

        const nombreArmadorAsignado =
          ordenActualizada.armador?.usuario.nombre ?? "Armador asignado";

        await prisma.registroEstado.create({
          data: {
            ordenId: orden.id,
            estadoAnterior: "SIN_ASIGNAR",
            estadoNuevo: "ASIGNADO",
            estadoCambiadoA: "ASIGNADO",
            usuarioId: session.userId,
            comentario: `Auto-asignado a ${nombreArmadorAsignado}`,
          },
        });

        return NextResponse.json({ orden: ordenActualizada }, { status: 201 });
      }
    }

    return NextResponse.json({ orden }, { status: 201 });
  } catch (error) {
    console.error("Error creando orden:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
};

// Exportar POST con validación
export const POST = withValidation(CrearOrdenSchema, crearOrdenHandler);