import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();

    if (!session || !["ADMIN", "SUPERVISOR"].includes(session.rol)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Obtener todos los turnos activos con información del armador
    const turnosActivos = await prisma.turno.findMany({
      where: {
        estado: "ACTIVO",
      },
      include: {
        armador: {
          include: {
            usuario: {
              select: {
                nombre: true,
                telefono: true,
                estadoLoggeo: true,
              },
            },
            ordenes: {
              where: {
                estado: {
                  in: ["ASIGNADO", "EN_RUTA", "ARMADO_INICIADO"],
                },
              },
              select: {
                id: true,
                codigoReferenciaRetail: true,
                estado: true,
              },
            },
          },
        },
        rutaPuntos: {
          orderBy: {
            timestamp: "desc",
          },
          take: 1, // Solo el último punto para ubicación actual
        },
      },
      orderBy: {
        inicioTurno: "desc",
      },
    });

    // Obtener todos los armadores activos (para detectar quiénes NO tienen turno)
    const todosArmadores = await prisma.armador.findMany({
      where: {
        estado: "ACTIVO",
      },
      include: {
        usuario: {
          select: {
            nombre: true,
            telefono: true,
            estadoLoggeo: true,
          },
        },
        turnos: {
          where: {
            estado: "ACTIVO",
          },
          select: {
            id: true,
          },
        },
      },
    });

    // Filtrar armadores sin turno activo
    const armadoresSinTurno = todosArmadores
      .filter((armador) => armador.turnos.length === 0)
      .map((armador) => ({
        id: armador.id,
        nombre: armador.usuario.nombre,
        telefono: armador.usuario.telefono,
        estadoLoggeo: armador.usuario.estadoLoggeo,
      }));

    // Formatear turnos activos
    const turnosFormateados = await Promise.all(
      turnosActivos
        .filter((t) => t.armador) // evitar nulos
        .map(async (turno) => {
        const ultimoPunto = turno.rutaPuntos[0];
        const totalPuntosRuta = await prisma.rutaPunto.count({
          where: { turnoId: turno.id },
        });

        return {
          id: turno.id,
          armadorId: turno.armadorId,
          armadorNombre: turno.armador.usuario.nombre,
          armadorTelefono: turno.armador.usuario.telefono,
          estadoLoggeo: turno.armador.usuario.estadoLoggeo,
          inicioTurno: turno.inicioTurno,
          duracionMinutos: Math.floor(
            (new Date().getTime() - turno.inicioTurno.getTime()) / 60000
          ),
          ordenesActivas: turno.armador.ordenes.length,
          ordenes: turno.armador.ordenes,
          ubicacionActual: ultimoPunto
            ? {
                lat: ultimoPunto.latitud,
                lng: ultimoPunto.longitud,
                timestamp: ultimoPunto.timestamp,
              }
            : turno.armador.ubicacionActualLat && turno.armador.ubicacionActualLng
            ? {
                lat: turno.armador.ubicacionActualLat,
                lng: turno.armador.ubicacionActualLng,
                timestamp: turno.armador.ultimaActualizacionGPS,
              }
            : null,
          totalPuntosRuta,
        };
      })
    );

    return NextResponse.json({
      turnosActivos: turnosFormateados,
      armadoresSinTurno,
      resumen: {
        totalTurnosActivos: turnosActivos.length,
        totalArmadoresActivos: todosArmadores.length,
        armadoresSinTurno: armadoresSinTurno.length,
      },
    });
  } catch (error) {
    console.error("Error obteniendo turnos activos:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
