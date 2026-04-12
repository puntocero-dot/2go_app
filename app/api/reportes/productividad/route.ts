import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || !["ADMIN", "SUPERVISOR"].includes(session.rol)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const armadorId = searchParams.get("armadorId");
    const fechaInicio = searchParams.get("fechaInicio");
    const fechaFin = searchParams.get("fechaFin");

    // Construir filtros
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {
      estado: {
        in: ["ACTIVO", "FINALIZADO"],
      },
    };

    if (armadorId) {
      whereClause.armadorId = armadorId;
    }

    if (fechaInicio || fechaFin) {
      whereClause.inicioTurno = {};
      if (fechaInicio) {
        whereClause.inicioTurno.gte = new Date(fechaInicio);
      }
      if (fechaFin) {
        const fechaFinDate = new Date(fechaFin);
        fechaFinDate.setHours(23, 59, 59, 999);
        whereClause.inicioTurno.lte = fechaFinDate;
      }
    }

    // Obtener turnos con información del armador y puntos de ruta
    const turnos = await prisma.turno.findMany({
      where: whereClause,
      include: {
        armador: {
          include: {
            usuario: {
              select: {
                nombre: true,
              },
            },
            ordenes: {
              where: {
                estado: "ARMADO_COMPLETADO",
              },
              select: {
                id: true,
                fechaCreacion: true,
                fechaCompletado: true,
              },
            },
          },
        },
        rutaPuntos: {
          select: {
            latitud: true,
            longitud: true,
            timestamp: true,
          },
          orderBy: {
            timestamp: "asc",
          },
        },
      },
      orderBy: {
        inicioTurno: "desc",
      },
    });

    // Calcular métricas por turno
    const turnosConMetricas = turnos.map((turno) => {
      const duracionMinutos = turno.finTurno
        ? Math.floor(
            (turno.finTurno.getTime() - turno.inicioTurno.getTime()) / 60000
          )
        : Math.floor(
            (new Date().getTime() - turno.inicioTurno.getTime()) / 60000
          );

      // Calcular distancia recorrida
      let distanciaTotal = 0;
      const puntos = turno.rutaPuntos;

      for (let i = 1; i < puntos.length; i++) {
        const p1 = puntos[i - 1];
        const p2 = puntos[i];
        distanciaTotal += calcularDistancia(
          p1.latitud,
          p1.longitud,
          p2.latitud,
          p2.longitud
        );
      }

      // Contar órdenes completadas durante el turno
      const ordenesCompletadas = turno.armador.ordenes.filter((orden) => {
        if (!orden.fechaCompletado) return false;
        return (
          orden.fechaCompletado >= turno.inicioTurno &&
          (!turno.finTurno || orden.fechaCompletado <= turno.finTurno)
        );
      }).length;

      return {
        id: turno.id,
        armadorId: turno.armadorId,
        armadorNombre: turno.armador.usuario.nombre,
        inicioTurno: turno.inicioTurno,
        finTurno: turno.finTurno,
        estado: turno.estado,
        duracionMinutos,
        duracionHoras: (duracionMinutos / 60).toFixed(2),
        distanciaKm: (distanciaTotal / 1000).toFixed(2),
        puntosGPS: puntos.length,
        ordenesCompletadas,
        promedioOrdenPorHora:
          duracionMinutos > 0
            ? ((ordenesCompletadas / duracionMinutos) * 60).toFixed(2)
            : "0.00",
      };
    });

    // Calcular estadísticas generales
    const totalTurnos = turnosConMetricas.length;
    const totalHoras = turnosConMetricas.reduce(
      (sum, t) => sum + parseFloat(t.duracionHoras),
      0
    );
    const totalDistancia = turnosConMetricas.reduce(
      (sum, t) => sum + parseFloat(t.distanciaKm),
      0
    );
    const totalOrdenes = turnosConMetricas.reduce(
      (sum, t) => sum + t.ordenesCompletadas,
      0
    );

    // Agrupar por armador
    const porArmador = turnosConMetricas.reduce((acc, turno) => {
      if (!acc[turno.armadorId]) {
        acc[turno.armadorId] = {
          armadorId: turno.armadorId,
          armadorNombre: turno.armadorNombre,
          totalTurnos: 0,
          totalHoras: 0,
          totalDistancia: 0,
          totalOrdenes: 0,
        };
      }

      acc[turno.armadorId].totalTurnos++;
      acc[turno.armadorId].totalHoras += parseFloat(turno.duracionHoras);
      acc[turno.armadorId].totalDistancia += parseFloat(turno.distanciaKm);
      acc[turno.armadorId].totalOrdenes += turno.ordenesCompletadas;

      return acc;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }, {} as Record<string, any>);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resumenPorArmador = Object.values(porArmador).map((armador: any) => ({
      ...armador,
      promedioHorasPorTurno: (armador.totalHoras / armador.totalTurnos).toFixed(
        2
      ),
      promedioOrdenesPorTurno: (
        armador.totalOrdenes / armador.totalTurnos
      ).toFixed(2),
      promedioDistanciaPorTurno: (
        armador.totalDistancia / armador.totalTurnos
      ).toFixed(2),
    }));

    return NextResponse.json({
      turnos: turnosConMetricas,
      resumen: {
        totalTurnos,
        totalHoras: totalHoras.toFixed(2),
        totalDistancia: totalDistancia.toFixed(2),
        totalOrdenes,
        promedioHorasPorTurno:
          totalTurnos > 0 ? (totalHoras / totalTurnos).toFixed(2) : "0.00",
        promedioOrdenesPorTurno:
          totalTurnos > 0 ? (totalOrdenes / totalTurnos).toFixed(2) : "0.00",
        promedioDistanciaPorTurno:
          totalTurnos > 0 ? (totalDistancia / totalTurnos).toFixed(2) : "0.00",
      },
      porArmador: resumenPorArmador,
    });
  } catch (error) {
    console.error("Error obteniendo reportes de productividad:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Función auxiliar para calcular distancia (Haversine)
function calcularDistancia(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Radio de la Tierra en metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
