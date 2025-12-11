import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analizarRuta } from "@/lib/geomaps-helpers";

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

    const armadoresConUbicacion = await Promise.all(
      armadores.map(async (armador) => {
        // Puntos de ruta recientes basados en RegistroEstado con GPS
        const registrosRuta = await prisma.registroEstado.findMany({
          where: {
            orden: {
              is: {
                armadorId: armador.id,
              },
            },
            latitud: { not: null },
            longitud: { not: null },
            timestamp: {
              gte: since,
            },
          },
          select: {
            latitud: true,
            longitud: true,
            timestamp: true,
          },
          orderBy: {
            timestamp: "asc",
          },
        });

        const puntosRuta = registrosRuta.map((r) => ({
          latitud: r.latitud as number,
          longitud: r.longitud as number,
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

        const ruta = registrosRuta.map((r) => ({
          lat: r.latitud as number,
          lng: r.longitud as number,
          timestamp: r.timestamp.toISOString(),
        }));

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