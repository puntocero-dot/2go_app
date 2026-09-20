import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analizarRuta, analizarDesvioRuta } from "@/lib/geomaps-helpers";
import { getRouteDirections } from "@/lib/mapbox-directions";

// GET - Obtener ubicaciones de todos los armadores activos
export async function GET() {
  try {
    const session = await getSession();

    if (!session || !["ADMIN", "SUPERVISOR"].includes(session.rol)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Ventana de tiempo para la ruta (últimas 24 horas)
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const armadores = await prisma.armador.findMany({
      where: {
        estado: "ACTIVO",
        ubicacionActualLat: { not: null },
        ubicacionActualLng: { not: null },
      },
      include: {
        usuario: {
          select: {
            nombre: true,
            telefono: true,
          },
        },
        ordenes: {
          where: {
            estado: {
              in: ["ASIGNADO", "EN_RUTA", "ARMADO_INICIADO"],
            },
          },
          include: {
            usuarioFinal: {
              select: {
                nombre: true,
                direccionCompleta: true,
                municipio: true,
                coordenadasLat: true,
                coordenadasLng: true,
              },
            },
          },
        },
      },
    });

    // Una sola query para todos los armadores en vez de N queries (una por armador).
    // Se usa el trazo GPS continuo del turno (RutaPunto) en vez de los puntos
    // sueltos que a veces vienen adjuntos a un cambio de estado (RegistroEstado):
    // esos últimos son esporádicos (solo cuando el cliente manda `gps` junto
    // con el cambio de estado) y subestiman paradas/desvíos reales.
    const armadorIds = armadores.map((a) => a.id);
    const turnosActivos = armadorIds.length
      ? await prisma.turno.findMany({
          where: { armadorId: { in: armadorIds }, estado: "ACTIVO" },
          include: {
            rutaPuntos: {
              where: { timestamp: { gte: since } },
              orderBy: { timestamp: "asc" },
            },
          },
        })
      : [];
    const turnoPorArmador = new Map(turnosActivos.map((t) => [t.armadorId, t]));

    const armadoresConUbicacion = await Promise.all(
      armadores.map(async (armador) => {
        const turno = turnoPorArmador.get(armador.id);
        const rutaPuntos = turno?.rutaPuntos ?? [];

        const puntosRuta = rutaPuntos.map((r) => ({
          latitud: r.latitud,
          longitud: r.longitud,
          timestamp: r.timestamp,
        }));

        const ordenesConClientes = armador.ordenes
          .filter(
            (orden) =>
              typeof orden.usuarioFinal.coordenadasLat === "number" &&
              typeof orden.usuarioFinal.coordenadasLng === "number"
          )
          .map((orden) => ({
            id: orden.id,
            clienteNombre: orden.usuarioFinal.nombre,
            clienteLat: orden.usuarioFinal.coordenadasLat as number,
            clienteLng: orden.usuarioFinal.coordenadasLng as number,
          }));

        const analisis = await analizarRuta(puntosRuta, ordenesConClientes);

        const ruta = rutaPuntos.map((r) => ({
          lat: r.latitud,
          lng: r.longitud,
          timestamp: r.timestamp.toISOString(),
        }));

        // Desvío de ruta: solo tiene sentido para la orden que está EN_RUTA
        // ahora mismo (las demás aún no salieron o ya se completaron).
        let desvioRutaActual: {
          ordenId: string;
          seDesvio: boolean;
          puntosFueraDeRuta: number;
          puntosTotales: number;
          distanciaMaximaDesvioMetros: number;
          radioDesvioMetros: number;
        } | null = null;

        const ordenEnRuta = armador.ordenes.find((o) => o.estado === "EN_RUTA");
        if (
          ordenEnRuta &&
          typeof ordenEnRuta.usuarioFinal.coordenadasLat === "number" &&
          typeof ordenEnRuta.usuarioFinal.coordenadasLng === "number" &&
          rutaPuntos.length > 0
        ) {
          const registroEnRuta = await prisma.registroEstado.findFirst({
            where: { ordenId: ordenEnRuta.id, estadoCambiadoA: "EN_RUTA" },
            orderBy: { timestamp: "asc" },
          });

          if (registroEnRuta) {
            const puntosViaje = rutaPuntos.filter(
              (p) => p.timestamp >= registroEnRuta.timestamp
            );

            if (puntosViaje.length > 0) {
              const origen = puntosViaje[0];
              const direcciones = await getRouteDirections(
                { lat: origen.latitud, lng: origen.longitud },
                {
                  lat: ordenEnRuta.usuarioFinal.coordenadasLat,
                  lng: ordenEnRuta.usuarioFinal.coordenadasLng,
                },
                "driving-traffic"
              );

              if (direcciones.route) {
                const desvio = await analizarDesvioRuta(
                  puntosViaje.map((p) => ({
                    latitud: p.latitud,
                    longitud: p.longitud,
                    timestamp: p.timestamp,
                  })),
                  direcciones.route.geometry.coordinates
                );

                desvioRutaActual = {
                  ordenId: ordenEnRuta.id,
                  seDesvio: desvio.seDesvio,
                  puntosFueraDeRuta: desvio.puntosFueraDeRuta,
                  puntosTotales: desvio.puntosTotales,
                  distanciaMaximaDesvioMetros: Math.round(desvio.distanciaMaximaMetros),
                  radioDesvioMetros: desvio.radioUsadoMetros,
                };
              }
            }
          }
        }

        return {
          id: armador.id,
          nombre: armador.usuario.nombre,
          telefono: armador.usuario.telefono,
          estado: armador.estado,
          lat: armador.ubicacionActualLat,
          lng: armador.ubicacionActualLng,
          ultimaActualizacion: armador.ultimaActualizacionGPS,
          ordenesActivas: armador.ordenes.length,
          ordenes: armador.ordenes.map((orden) => ({
            id: orden.id,
            codigo: orden.codigoReferenciaRetail,
            cliente: orden.usuarioFinal.nombre,
            direccion: orden.usuarioFinal.direccionCompleta,
            municipio: orden.usuarioFinal.municipio,
            estado: orden.estado,
          })),
          ruta,
          analisis,
          desvioRutaActual,
        };
      })
    );

    return NextResponse.json({ armadores: armadoresConUbicacion });
  } catch (error) {
    console.error("Error obteniendo ubicaciones:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}