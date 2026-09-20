import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRouteDirections } from "@/lib/mapbox-directions";
import { analizarRuta, analizarDesvioRuta } from "@/lib/geomaps-helpers";

interface OrdenAnalizada {
  ordenId: string;
  codigo: string;
  cliente: string;
  inicioViaje: Date;
  finViaje: Date;
  seDesvio: boolean;
  puntosFueraDeRuta: number;
  puntosTotales: number;
  distanciaMaximaDesvioMetros: number;
  radioDesvioMetros: number;
}

// GET - Obtener todos los puntos de ruta de un turno, con análisis de
// paradas y desvíos de ruta por cada orden atendida durante el turno.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id: turnoId } = await params;

    // Obtener turno con puntos de ruta
    const turno = await prisma.turno.findUnique({
      where: { id: turnoId },
      include: {
        armador: {
          include: {
            usuario: {
              select: {
                nombre: true,
                email: true,
              },
            },
          },
        },
        rutaPuntos: {
          orderBy: { timestamp: "asc" },
        },
      },
    });

    if (!turno) {
      return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
    }

    // Verificar permisos: solo el armador o admin/supervisor pueden ver
    const esArmador = turno.armador.usuarioId === session.userId;
    const esAdminOSupervisor = session.rol === "ADMIN" || session.rol === "SUPERVISOR";

    if (!esArmador && !esAdminOSupervisor) {
      return NextResponse.json(
        { error: "No autorizado para ver este turno" },
        { status: 403 }
      );
    }

    const puntosRuta = turno.rutaPuntos.map((p) => ({
      latitud: p.latitud,
      longitud: p.longitud,
      timestamp: p.timestamp,
    }));

    // Paradas, velocidad y proximidad a clientes en todo el turno
    const analisis = await analizarRuta(puntosRuta);

    // Órdenes que este armador llevó "en ruta" durante la ventana del turno
    const ventanaFin = turno.finTurno ?? new Date();
    const ordenesDelTurno = await prisma.orden.findMany({
      where: {
        armadorId: turno.armadorId,
        registrosEstado: {
          some: {
            estadoCambiadoA: "EN_RUTA",
            timestamp: { gte: turno.inicioTurno, lte: ventanaFin },
          },
        },
      },
      select: {
        id: true,
        codigoReferenciaRetail: true,
        usuarioFinal: {
          select: { nombre: true, coordenadasLat: true, coordenadasLng: true },
        },
        registrosEstado: {
          where: { timestamp: { gte: turno.inicioTurno } },
          orderBy: { timestamp: "asc" },
          select: { estadoCambiadoA: true, timestamp: true },
        },
      },
    });

    const ordenesAnalizadas: OrdenAnalizada[] = [];

    for (const orden of ordenesDelTurno) {
      if (
        orden.usuarioFinal?.coordenadasLat == null ||
        orden.usuarioFinal?.coordenadasLng == null
      ) {
        continue;
      }

      const registros = orden.registrosEstado;
      const idxEnRuta = registros.findIndex((r) => r.estadoCambiadoA === "EN_RUTA");
      if (idxEnRuta === -1) continue;

      const inicioViaje = registros[idxEnRuta].timestamp;
      const finViaje = registros[idxEnRuta + 1]?.timestamp ?? ventanaFin;

      const puntosViaje = turno.rutaPuntos.filter(
        (p) => p.timestamp >= inicioViaje && p.timestamp <= finViaje
      );
      if (puntosViaje.length === 0) continue;

      const origen = puntosViaje[0];
      const direcciones = await getRouteDirections(
        { lat: origen.latitud, lng: origen.longitud },
        { lat: orden.usuarioFinal.coordenadasLat, lng: orden.usuarioFinal.coordenadasLng },
        "driving-traffic"
      );

      if (!direcciones.route) continue;

      const desvio = await analizarDesvioRuta(
        puntosViaje.map((p) => ({
          latitud: p.latitud,
          longitud: p.longitud,
          timestamp: p.timestamp,
        })),
        direcciones.route.geometry.coordinates
      );

      ordenesAnalizadas.push({
        ordenId: orden.id,
        codigo: orden.codigoReferenciaRetail,
        cliente: orden.usuarioFinal.nombre,
        inicioViaje,
        finViaje,
        seDesvio: desvio.seDesvio,
        puntosFueraDeRuta: desvio.puntosFueraDeRuta,
        puntosTotales: desvio.puntosTotales,
        distanciaMaximaDesvioMetros: Math.round(desvio.distanciaMaximaMetros),
        radioDesvioMetros: desvio.radioUsadoMetros,
      });
    }

    return NextResponse.json({ ...turno, analisis, ordenesAnalizadas });
  } catch (error) {
    console.error("Error obteniendo ruta:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
