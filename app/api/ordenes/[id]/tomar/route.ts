import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notificarCambioEstadoOrden } from "@/lib/notificaciones";
import { logAuditFromSession } from "@/lib/audit-logger";
import { getRouteDirections, formatDuration, formatDistance } from "@/lib/mapbox-directions";
import { computeAndStoreAccumulatedTimes } from "@/lib/timing";
import { publishOrderUpdate } from "@/lib/realtime/publisher";

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

    // Calcular ruta sugerida y ETA si hay coordenadas del destino y del armador
    let rutaSugerida: {
      distancia: string;
      distanciaMetros: number;
      duracion: string;
      duracionSegundos: number;
      geometry: { type: string; coordinates: [number, number][] };
    } | null = null;

    if (
      orden.usuarioFinal?.coordenadasLat != null &&
      orden.usuarioFinal?.coordenadasLng != null &&
      armador.ubicacionActualLat != null &&
      armador.ubicacionActualLng != null
    ) {
      const direcciones = await getRouteDirections(
        { lat: armador.ubicacionActualLat, lng: armador.ubicacionActualLng },
        { lat: orden.usuarioFinal.coordenadasLat, lng: orden.usuarioFinal.coordenadasLng },
        'driving-traffic'
      );

      if (direcciones.route) {
        rutaSugerida = {
          distancia: formatDistance(direcciones.route.distance),
          distanciaMetros: direcciones.route.distance,
          duracion: formatDuration(direcciones.route.duration),
          duracionSegundos: direcciones.route.duration,
          geometry: direcciones.route.geometry,
        };
      }
    }

    // Guardar ETA en RegistroEstado si hay ruta calculada
    const etaEstimado = rutaSugerida
      ? new Date(Date.now() + rutaSugerida.duracionSegundos * 1000)
      : undefined;

    await prisma.registroEstado.create({
      data: {
        ordenId: orden.id,
        estadoAnterior: ordenActual.estado,
        estadoNuevo: "ASIGNADO",
        estadoCambiadoA: "ASIGNADO",
        usuarioId: session.userId,
        comentario: "Orden tomada por armador",
        etaEstimado,
      },
    });

    // Actualizar tiempos acumulados por estado
    await computeAndStoreAccumulatedTimes(orden.id);

    await notificarCambioEstadoOrden(orden.id);

    // SSE: publicar cambio de estado en Redis para clientes en tiempo real
    await publishOrderUpdate(orden.id, "ASIGNADO");

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

    return NextResponse.json({ orden, rutaSugerida });
  } catch (error) {
    console.error("Error al tomar orden como armador:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
