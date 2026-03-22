import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { turnoService } from "@/lib/services";
import { isFeatureEnabled } from "@/lib/feature-flags";

export async function GET() {
  try {
    const session = await getSession();

    if (!session || !["ADMIN", "SUPERVISOR"].includes(session.rol)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Usar Service Layer si el feature flag está habilitado
    const useServiceLayer = isFeatureEnabled('SERVICE_LAYER', session.userId, session.rol);
    
    if (useServiceLayer) {
      const turnosActivos = await turnoService.obtenerTurnosActivos();
      
      // Obtener armadores sin turno
      const todosArmadores = await prisma.armador.findMany({
        where: { estado: "ACTIVO" },
        include: {
          usuario: { select: { nombre: true, telefono: true, estadoLoggeo: true } },
          turnos: { where: { estado: "ACTIVO" }, select: { id: true } },
        },
      });
      
      const armadoresSinTurno = todosArmadores
        .filter((a) => a.turnos.length === 0)
        .map((a) => ({
          id: a.id,
          nombre: a.usuario.nombre,
          telefono: a.usuario.telefono,
          estadoLoggeo: a.usuario.estadoLoggeo,
        }));
      
      return NextResponse.json({
        turnosActivos,
        armadoresSinTurno,
        resumen: {
          totalTurnosActivos: turnosActivos.length,
          totalArmadoresActivos: todosArmadores.length,
          armadoresSinTurno: armadoresSinTurno.length,
        },
      });
    }

    // Lógica original (sin Service Layer)
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

    // Obtener conteos de puntos en una sola query (evitar N+1)
    const puntosConteo = await prisma.rutaPunto.groupBy({
      by: ["turnoId"],
      _count: { id: true },
    });
    
    const puntosMap = new Map(
      puntosConteo.map((p) => [p.turnoId, p._count.id])
    );

    // Formatear turnos activos sin queries adicionales
    const turnosFormateados = turnosActivos
      .filter((t) => t.armador) // evitar nulos
      .map((turno) => {
        const ultimoPunto = turno.rutaPuntos[0];
        const totalPuntosRuta = puntosMap.get(turno.id) || 0;

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
      });

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
