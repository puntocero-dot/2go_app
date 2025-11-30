import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notificarCambioEstadoOrden } from "@/lib/notificaciones";
import { logAuditFromSession } from "@/lib/audit-logger";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const session = await getSession();

    if (!session || session.rol !== "ARMADOR") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const armador = await prisma.armador.findUnique({
      where: { usuarioId: session.userId },
    });

    if (!armador) {
      return NextResponse.json(
        { error: "No se encontró perfil de armador para este usuario" },
        { status: 400 },
      );
    }

    const ordenActual = await prisma.orden.findUnique({
      where: { id },
    });

    if (!ordenActual) {
      return NextResponse.json(
        { error: "Orden no encontrada" },
        { status: 404 },
      );
    }

    if (ordenActual.estado !== "SIN_ASIGNAR" || ordenActual.armadorId) {
      return NextResponse.json(
        { error: "La orden ya fue asignada o no está disponible" },
        { status: 409 },
      );
    }

    const orden = await prisma.orden.update({
      where: { id },
      data: {
        armadorId: armador.id,
        estado: "ASIGNADO",
        fechaAsignacion: ordenActual.fechaAsignacion ?? new Date(),
      },
      include: {
        mueble: true,
        usuarioFinal: true,
        proyecto: true,
      },
    });

    await prisma.registroEstado.create({
      data: {
        ordenId: orden.id,
        estadoAnterior: ordenActual.estado,
        estadoNuevo: "ASIGNADO",
        estadoCambiadoA: "ASIGNADO",
        usuarioId: session.userId,
        comentario: "Orden tomada por armador",
      },
    });

    await notificarCambioEstadoOrden(orden.id);

    await logAuditFromSession({
      session,
      action: "ASSIGN_ORDER",
      resource: "orden",
      resourceId: orden.id,
      changes: {
        before: {
          estado: ordenActual.estado,
          armadorId: ordenActual.armadorId,
        },
        after: {
          estado: orden.estado,
          armadorId: orden.armadorId,
        },
      },
      request,
    });

    return NextResponse.json({ orden });
  } catch (error) {
    console.error("Error al tomar orden como armador:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
