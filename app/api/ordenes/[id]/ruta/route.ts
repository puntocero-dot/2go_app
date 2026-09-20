import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRouteDirections, calculateRouteDeviation, formatDuration, formatDistance } from "@/lib/mapbox-directions";
import { analizarDesvioRuta } from "@/lib/geomaps-helpers";

// GET - Obtener ruta de una orden
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const { id } = await params;

    if (!session || !["ADMIN", "SUPERVISOR", "ARMADOR"].includes(session.rol)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Buscar la orden con el armador asignado y su turno más reciente
    const orden = await prisma.orden.findUnique({
      where: { id },
      include: {
        armador: {
          include: {
            turnos: {
              where: {
                estado: {
                  in: ["ACTIVO", "FINALIZADO"],
                },
              },
              include: {
                rutaPuntos: {
                  orderBy: {
                    timestamp: "asc",
                  },
                },
              },
              orderBy: {
                inicioTurno: "desc",
              },
              take: 1, // Solo el turno más reciente
            },
          },
        },
        usuarioFinal: {
          select: {
            coordenadasLat: true,
            coordenadasLng: true,
          },
        },
      },
    });

    if (!orden) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    const destino =
      orden.usuarioFinal?.coordenadasLat != null &&
      orden.usuarioFinal?.coordenadasLng != null
        ? {
            lat: orden.usuarioFinal.coordenadasLat,
            lng: orden.usuarioFinal.coordenadasLng,
          }
        : null;

    const respuestaBase = {
      ordenId: id,
      ruta: [] as Array<{
        lat: number;
        lng: number;
        timestamp: Date;
        tipo: string;
      }>,
      destino,
      turnoId: null as string | null,
      inicioTurno: null as Date | null,
      finTurno: null as Date | null,
    };

    // Si no hay armador asignado o no tiene turnos, retornar vacío
    if (!orden.armador || !Array.isArray(orden.armador.turnos) || orden.armador.turnos.length === 0) {
      return NextResponse.json(respuestaBase);
    }

    const turno = orden.armador.turnos[0];
    const puntos = Array.isArray(turno.rutaPuntos) ? turno.rutaPuntos : [];
    const ruta = puntos.map((punto) => ({
      lat: punto.latitud,
      lng: punto.longitud,
      timestamp: punto.timestamp,
      tipo: punto.tipo,
    }));

    // Determinar cuándo esta orden específica pasó a EN_RUTA (y cuándo terminó
    // ese tramo). Un turno puede cubrir varias órdenes en un mismo día, así
    // que usar el primer punto GPS del turno completo como "origen" (como
    // hacía esto antes) da un origen incorrecto para cualquier orden que no
    // sea la primera parada del turno.
    const registroEnRuta = await prisma.registroEstado.findFirst({
      where: { ordenId: id, estadoCambiadoA: "EN_RUTA" },
      orderBy: { timestamp: "asc" },
    });

    let rutaSugerida = null;
    let comparacion = null;

    if (ruta.length > 0 && destino && registroEnRuta) {
      const registroSiguiente = await prisma.registroEstado.findFirst({
        where: { ordenId: id, timestamp: { gt: registroEnRuta.timestamp } },
        orderBy: { timestamp: "asc" },
      });

      const inicioViaje = registroEnRuta.timestamp;
      const finViaje = registroSiguiente?.timestamp ?? new Date();

      // Puntos GPS reales durante el tramo "en camino" hacia esta orden
      const puntosViaje = ruta.filter(
        (p) => p.timestamp >= inicioViaje && p.timestamp <= finViaje
      );

      // Origen: el punto GPS más cercano al momento en que empezó el viaje
      const origen =
        puntosViaje[0] ??
        ruta.find((p) => p.timestamp >= inicioViaje) ??
        null;

      if (origen) {
        // Obtener ruta sugerida por carretera desde ese origen hasta el destino
        const direcciones = await getRouteDirections(
          { lat: origen.lat, lng: origen.lng },
          { lat: destino.lat, lng: destino.lng },
          'driving-traffic'
        );

        if (direcciones.route) {
          rutaSugerida = {
            geometry: direcciones.route.geometry,
            distancia: formatDistance(direcciones.route.distance),
            distanciaMetros: direcciones.route.distance,
            duracion: formatDuration(direcciones.route.duration),
            duracionSegundos: direcciones.route.duration,
          };

          // Comparación agregada (km totales) para dar contexto informativo...
          const gpsPoints = puntosViaje.map(p => ({ lat: p.lat, lng: p.lng }));
          const desviacion = calculateRouteDeviation(gpsPoints, direcciones.route.geometry);

          // ...pero "seDesvio" se decide con la comparación espacial punto a
          // punto contra la polilínea sugerida, no con el % de distancia total
          // (dos rutas pueden medir lo mismo y aun así ir a lugares distintos).
          const desvioEspacial = await analizarDesvioRuta(
            puntosViaje.map((p) => ({ latitud: p.lat, longitud: p.lng, timestamp: p.timestamp })),
            direcciones.route.geometry.coordinates
          );

          comparacion = {
            distanciaGpsKm: desviacion.totalGpsDistance,
            distanciaSugeridaKm: desviacion.suggestedDistance,
            desviacionPorcentaje: desviacion.deviationPercent,
            kmExtra: desviacion.extraKm,
            seDesvio: desvioEspacial.seDesvio,
            puntosFueraDeRuta: desvioEspacial.puntosFueraDeRuta,
            puntosTotales: desvioEspacial.puntosTotales,
            distanciaMaximaDesvioMetros: Math.round(desvioEspacial.distanciaMaximaMetros),
            radioDesvioMetros: desvioEspacial.radioUsadoMetros,
          };
        }
      }
    }

    return NextResponse.json({
      ...respuestaBase,
      ruta,
      turnoId: turno.id,
      inicioTurno: turno.inicioTurno,
      finTurno: turno.finTurno,
      rutaSugerida,
      comparacion,
    });
  } catch (error) {
    console.error("Error obteniendo ruta:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
