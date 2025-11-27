import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    // Buscar la orden con el armador asignado
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

    // Si no hay armador asignado o no tiene turnos, retornar vacío
    if (!orden.armador || !orden.armador.turnos || orden.armador.turnos.length === 0) {
      return NextResponse.json({
        ordenId: id,
        ruta: [],
        destino: orden.usuarioFinal?.coordenadasLat && orden.usuarioFinal?.coordenadasLng
          ? {
              lat: orden.usuarioFinal.coordenadasLat,
              lng: orden.usuarioFinal.coordenadasLng,
            }
          : null,
      });
    }

    const turno = orden.armador.turnos[0];
    const ruta = turno.rutaPuntos.map((punto) => ({
      lat: punto.latitud,
      lng: punto.longitud,
      timestamp: punto.timestamp,
      tipo: punto.tipo,
    }));

    return NextResponse.json({
      ordenId: id,
      ruta,
      destino: orden.usuarioFinal?.coordenadasLat && orden.usuarioFinal?.coordenadasLng
        ? {
            lat: orden.usuarioFinal.coordenadasLat,
            lng: orden.usuarioFinal.coordenadasLng,
          }
        : null,
      turnoId: turno.id,
      inicioTurno: turno.inicioTurno,
      finTurno: turno.finTurno,
    });
  } catch (error) {
    console.error("Error obteniendo ruta:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
