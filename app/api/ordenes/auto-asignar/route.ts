import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { asignarArmadorAutomatico } from "@/lib/auto-assign-armador";
import { withValidation } from "@/lib/api-helpers";
import { AutoAsignarOrdenesSchema, AutoAsignarOrdenesInput } from "@/lib/schemas/orden.schemas";
import { logAuditFromSession } from "@/lib/audit-logger";

const autoAsignarHandler = async (
  data: AutoAsignarOrdenesInput,
  request: NextRequest
) => {
  try {
    const session = await getSession();

    if (!session || !["ADMIN", "SUPERVISOR"].includes(session.rol)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const ordenIds = data.ordenIds
      .map((id) => (typeof id === "string" ? id.trim() : ""))
      .filter((id) => id.length > 0);

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
    let skippedNoAutorizado = 0;

    // Una sola query para todas las órdenes en vez de un findUnique por id
    // dentro del loop. La asignación de armador sí se mantiene secuencial
    // más abajo: dos iteraciones en paralelo podrían asignar el mismo
    // armador dos veces (depende de estado mutable entre iteraciones).
    const ordenesPorId = new Map(
      (await prisma.orden.findMany({ where: { id: { in: ordenIds } } })).map(
        (orden) => [orden.id, orden]
      )
    );

    // El chequeo de rol de arriba es global, no por orden: sin esto un
    // SUPERVISOR podía enviar ids de órdenes de proyectos que no supervisa
    // y el endpoint las auto-asignaba igual. Se resuelve una sola vez
    // (no por orden dentro del loop) para no reintroducir un N+1.
    const proyectosSupervisados =
      session.rol === "SUPERVISOR"
        ? new Set(
            (
              await prisma.supervisorProyecto.findMany({
                where: { usuarioId: session.userId },
                select: { proyectoId: true },
              })
            ).map((sp) => sp.proyectoId)
          )
        : null;

    for (const id of ordenIds) {
      const orden = ordenesPorId.get(id);

      if (!orden) {
        continue;
      }

      if (proyectosSupervisados && !proyectosSupervisados.has(orden.proyectoId)) {
        skippedNoAutorizado += 1;
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

    await logAuditFromSession({
      session,
      action: "BULK_OPERATION",
      resource: "orden",
      changes: {
        after: {
          processed,
          assigned,
          skippedNotSinAsignar,
          skippedNoArmador,
          skippedNoAutorizado,
        },
      },
      request,
    });

    return NextResponse.json({
      summary: {
        processed,
        assigned,
        skippedNotSinAsignar,
        skippedNoArmador,
        skippedNoAutorizado,
      },
    });
  } catch (error) {
    console.error("Error en auto-asignación masiva de órdenes:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
};

export const POST = withValidation(AutoAsignarOrdenesSchema, autoAsignarHandler);
