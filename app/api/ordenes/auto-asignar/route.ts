import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { asignarArmadorAutomatico } from "@/lib/auto-assign-armador";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || !["ADMIN", "SUPERVISOR"].includes(session.rol)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const ordenIds = Array.isArray(body?.ordenIds)
      ? body.ordenIds.filter((id: unknown): id is string => typeof id === "string" && id.trim().length > 0)
      : [];

    if (ordenIds.length === 0) {
      return NextResponse.json(
        { error: "No se recibieron órdenes para auto-asignar" },
        { status: 400 }
      );
    }

    let processed = 0;
    let assigned = 0;
    let skippedNotSinAsignar = 0;
    let skippedNoArmador = 0;

    for (const rawId of ordenIds) {
      const id = rawId.trim();

      const orden = await prisma.orden.findUnique({
        where: { id },
      });

      if (!orden) {
        continue;
      }

      processed += 1;

      if (orden.estado !== "SIN_ASIGNAR") {
        skippedNotSinAsignar += 1;
        continue;
      }

      const armadorAsignado = await asignarArmadorAutomatico(orden);

      if (!armadorAsignado) {
        skippedNoArmador += 1;
        continue;
      }

      const ordenActualizada = await prisma.orden.update({
        where: { id: orden.id },
        data: {
          armadorId: armadorAsignado.id,
          estado: "ASIGNADO",
          fechaAsignacion: new Date(),
        },
      });

      const nombreArmadorAsignado = armadorAsignado.usuario?.nombre ?? "Armador asignado";

      await prisma.registroEstado.create({
        data: {
          ordenId: ordenActualizada.id,
          estadoAnterior: "SIN_ASIGNAR",
          estadoNuevo: "ASIGNADO",
          estadoCambiadoA: "ASIGNADO",
          usuarioId: session.userId,
          comentario: `Auto-asignado a ${nombreArmadorAsignado}`,
        },
      });

      assigned += 1;
    }

    return NextResponse.json({
      summary: {
        processed,
        assigned,
        skippedNotSinAsignar,
        skippedNoArmador,
      },
    });
  } catch (error) {
    console.error("Error en auto-asignación masiva de órdenes:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
