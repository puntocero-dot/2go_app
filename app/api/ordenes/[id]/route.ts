import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notificarCambioEstadoOrden } from "@/lib/notificaciones";
import { withValidation } from "@/lib/api-helpers";
import { ActualizarOrdenApiSchema, ActualizarOrdenApiInput } from "@/lib/schemas/orden.schemas";
import { logAuditFromSession } from "@/lib/audit-logger";
import { getRouteDirections } from "@/lib/mapbox-directions";
import { computeAndStoreAccumulatedTimes } from "@/lib/timing";

type RouteContext = { params: Promise<{ id: string }> };

// GET - Obtener orden por ID
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params;

  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const orden = await prisma.orden.findUnique({
      where: { id },
      include: {
        mueble: true,
        usuarioFinal: true,
        armador: {
          include: {
            usuario: {
              select: {
                nombre: true,
                telefono: true,
                email: true,
              },
            },
          },
        },
        proyecto: true,
        archivos: true,
        registrosEstado: {
          orderBy: { timestamp: "desc" },
        },
      },
    });

    if (!orden) {
      return NextResponse.json(
        { error: "Orden no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ orden });
  } catch (error) {
    console.error("Error obteniendo orden:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar orden
const actualizarOrdenHandler = async (
  data: ActualizarOrdenApiInput,
  request: NextRequest,
  context: RouteContext
) => {
  const { id } = await context.params;

  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dataAny = data as any;
    const { estado, armadorId, comentario, autoAssignMeta, gps, receptor, csat } = dataAny;

    // Obtener orden actual
    const ordenActual = await prisma.orden.findUnique({
      where: { id },
    });

    if (!ordenActual) {
      return NextResponse.json(
        { error: "Orden no encontrada" },
        { status: 404 }
      );
    }

    // Reglas de permisos
    const esAdminOSupervisor = ["ADMIN", "SUPERVISOR"].includes(session.rol);

    // Si es ARMADOR, debe estar asignado a la orden y solo puede cambiar estado
    if (session.rol === "ARMADOR") {
      const armador = await prisma.armador.findUnique({
        where: { usuarioId: session.userId },
      });

      if (!armador || ordenActual.armadorId !== armador.id) {
        return NextResponse.json(
          { error: "No tienes permiso para modificar esta orden" },
          { status: 403 }
        );
      }

      if (armadorId !== undefined && armadorId !== ordenActual.armadorId) {
        return NextResponse.json(
          { error: "No puedes reasignar la orden a otro armador" },
          { status: 403 }
        );
      }
    }

    // Preparar datos de actualización
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    if (estado) {
      updateData.estado = estado;
      // Actualizar fechas según el estado
      if (estado === "ASIGNADO" && !ordenActual.fechaAsignacion) {
        updateData.fechaAsignacion = new Date();
      }

      if (estado === "EN_RUTA" && !ordenActual.fechaRuta) {
        updateData.fechaRuta = new Date();
      }
      if (estado === "ARMADO_INICIADO" && !ordenActual.fechaInicioArmado) {
        updateData.fechaInicioArmado = new Date();
      }
      if (estado === "ARMADO_FINALIZADO" && !ordenActual.fechaFinArmado) {
        updateData.fechaFinArmado = new Date();
      }
      if (estado === "ARMADO_COMPLETADO" && !ordenActual.fechaCompletado) {
        updateData.fechaCompletado = new Date();
      }

      // Datos del receptor al completar el servicio
      if (estado === "ARMADO_COMPLETADO") {
        if (receptor && typeof receptor === "object") {
          const nombre =
            typeof receptor.nombre === "string" && receptor.nombre.trim().length > 0
              ? receptor.nombre.trim()
              : undefined;
          const documento =
            typeof receptor.documento === "string" &&
            receptor.documento.trim().length > 0
              ? receptor.documento.trim()
              : undefined;

          if (nombre) {
            updateData.nombreReceptor = nombre;
          }
          if (documento) {
            updateData.documentoReceptor = documento;
          }
        }

        // Encuesta CSAT (opcional)
        if (csat && typeof csat === "object") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const puntajeRaw = (csat as any).puntaje;
          const puntajeNum =
            typeof puntajeRaw === "number"
              ? puntajeRaw
              : typeof puntajeRaw === "string"
              ? Number.parseInt(puntajeRaw, 10)
              : NaN;

          if (Number.isFinite(puntajeNum) && puntajeNum >= 1 && puntajeNum <= 5) {
            updateData.csatPuntaje = puntajeNum;
            updateData.csatFecha = new Date();
          }

          const comentarioCsat =
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            typeof (csat as any).comentario === "string" &&
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (csat as any).comentario.trim().length > 0
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ? (csat as any).comentario.trim()
              : undefined;

          if (comentarioCsat) {
            updateData.csatComentario = comentarioCsat;
          }
        }
      }
    }

    if (armadorId !== undefined) {
      if (!esAdminOSupervisor && armadorId !== ordenActual.armadorId) {
        return NextResponse.json(
          { error: "Solo administradores o supervisores pueden cambiar el armador" },
          { status: 403 }
        );
      }

      updateData.armadorId = armadorId;
      if (armadorId && !ordenActual.fechaAsignacion) {
        updateData.fechaAsignacion = new Date();
      }
    }

    // Actualizar orden
    const orden = await prisma.orden.update({
      where: { id },
      data: updateData,
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

    const asyncTasks: Promise<unknown>[] = [];

    // Registrar cambio de estado si hubo cambio
    if (estado && estado !== ordenActual.estado) {
      // Calcular ETA: usar autoAssignMeta si existe, o calcular con Mapbox si es EN_RUTA
      let etaDate =
        typeof autoAssignMeta?.etaEstimadoMin === "number"
          ? new Date(Date.now() + autoAssignMeta.etaEstimadoMin * 60 * 1000)
          : undefined;

      // Si cambia a EN_RUTA y no hay ETA de autoAssign, calcular con Mapbox
      if (estado === "EN_RUTA" && !etaDate && orden.armadorId) {
        try {
          const armadorGps = await prisma.armador.findUnique({
            where: { id: orden.armadorId },
            select: { ubicacionActualLat: true, ubicacionActualLng: true },
          });
          if (
            armadorGps?.ubicacionActualLat &&
            armadorGps?.ubicacionActualLng &&
            orden.usuarioFinal?.coordenadasLat &&
            orden.usuarioFinal?.coordenadasLng
          ) {
            const directions = await getRouteDirections(
              { lat: armadorGps.ubicacionActualLat, lng: armadorGps.ubicacionActualLng },
              { lat: orden.usuarioFinal.coordenadasLat, lng: orden.usuarioFinal.coordenadasLng },
              "driving-traffic"
            );
            if (directions.route) {
              etaDate = new Date(Date.now() + directions.route.duration * 1000);
            }
          }
        } catch (e) {
          console.warn("[ETA] Error calculando ETA en transicion EN_RUTA:", e);
        }
      }

      const latitud =
        gps && typeof gps.latitud === "number" ? (gps.latitud as number) : undefined;
      const longitud =
        gps && typeof gps.longitud === "number" ? (gps.longitud as number) : undefined;

      asyncTasks.push(
        prisma.registroEstado.create({
          data: {
            ordenId: id,
            estadoAnterior: ordenActual.estado,
            estadoNuevo: estado,
            estadoCambiadoA: estado,
            comentario:
              typeof comentario === "string" && comentario.trim().length > 0
                ? comentario.trim()
                : undefined,
            usuarioId: session.userId,
            etaEstimado: etaDate,
            latitud,
            longitud,
          },
        })
      );

      // Actualizar tiempos acumulados por estado
      asyncTasks.push(computeAndStoreAccumulatedTimes(id));

      // ENVIAR NOTIFICACIONES
      asyncTasks.push(notificarCambioEstadoOrden(id));
    }

    if (autoAssignMeta) {
      asyncTasks.push(
        prisma.logActividad.create({
          data: {
            usuarioId: session.userId,
            accion: "ASIGNACION_AUTOMATICA",
            entidad: "Orden",
            entidadId: id,
            detalles: autoAssignMeta,
          },
        })
      );
    }

    if (asyncTasks.length > 0) {
      await Promise.all(asyncTasks);
    }

    await logAuditFromSession({
      session,
      action: "UPDATE_ORDER",
      resource: "orden",
      resourceId: id,
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
      metadata: autoAssignMeta ? { autoAssignMeta } : undefined,
      request,
    });

    return NextResponse.json({ orden });
  } catch (error) {
    console.error("Error actualizando orden:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error interno del servidor al actualizar la orden.",
      },
      { status: 500 }
    );
  }
};

export const PUT = withValidation(ActualizarOrdenApiSchema, actualizarOrdenHandler);

// DELETE - Cancelar orden
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params;

  try {
    const session = await getSession();

    if (!session || !["ADMIN", "SUPERVISOR"].includes(session.rol)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    const orden = await prisma.orden.findUnique({
      where: { id },
    });

    if (!orden) {
      return NextResponse.json(
        { error: "Orden no encontrada" },
        { status: 404 }
      );
    }

    if (orden.estado === "SIN_ASIGNAR") {
      await prisma.orden.delete({
        where: { id },
      });

      await logAuditFromSession({
        session,
        action: "DELETE_ORDER",
        resource: "orden",
        resourceId: id,
        changes: {
          before: {
            estado: orden.estado,
          },
        },
        request,
      });

      return NextResponse.json({
        action: "deleted",
        message: "Orden eliminada permanentemente",
      });
    }

    const ordenCancelada = await prisma.orden.update({
      where: { id },
      data: {
        estado: "CANCELADA",
      },
    });

    await prisma.registroEstado.create({
      data: {
        ordenId: id,
        estadoAnterior: orden.estado,
        estadoNuevo: "CANCELADA",
        estadoCambiadoA: "CANCELADA",
        usuarioId: session.userId,
        comentario: "Orden cancelada por administrador",
      },
    });

    await logAuditFromSession({
      session,
      action: "CANCEL_ORDER",
      resource: "orden",
      resourceId: id,
      changes: {
        before: { estado: orden.estado },
        after: { estado: ordenCancelada.estado },
      },
      request,
    });

    return NextResponse.json({
      action: "cancelled",
      message: "Orden cancelada",
      orden: ordenCancelada,
    });
  } catch (error) {
    console.error("Error eliminando orden:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}