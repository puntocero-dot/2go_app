import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRouteDirections, calculateRouteDeviation, formatDuration, formatDistance } from "@/lib/mapbox-directions";

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

    // Calcular ruta sugerida por carretera si hay puntos GPS y destino
    let rutaSugerida = null;
    let comparacion = null;

    if (ruta.length > 0 && destino) {
      const origen = ruta[0]; // Primer punto GPS (inicio del recorrido)
      
      // Obtener ruta sugerida por carretera desde el punto de inicio hasta el destino
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

        // Calcular desviación entre ruta GPS real y ruta sugerida
        const gpsPoints = ruta.map(p => ({ lat: p.lat, lng: p.lng }));
        const desviacion = calculateRouteDeviation(gpsPoints, direcciones.route.geometry);
        
        comparacion = {
          distanciaGpsKm: desviacion.totalGpsDistance,
          distanciaSugeridaKm: desviacion.suggestedDistance,
          desviacionPorcentaje: desviacion.deviationPercent,
          kmExtra: desviacion.extraKm,
          seDesvio: desviacion.deviationPercent > 15, // Más de 15% se considera desviación significativa
        };
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
