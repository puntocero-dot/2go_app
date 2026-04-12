import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/reportes/eta-precision
 * Compara ETAs predichos vs tiempos reales de llegada.
 * Mide la precision del sistema de estimacion.
 *
 * Query params:
 *   desde: fecha inicio (ISO)
 *   hasta: fecha fin (ISO)
 *   proyectoId: filtrar por proyecto (opcional)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !["ADMIN", "SUPERVISOR"].includes(session.rol)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = request.nextUrl;
    const desde = searchParams.get("desde");
    const hasta = searchParams.get("hasta");
    const proyectoId = searchParams.get("proyectoId");

    // Buscar ordenes que pasaron por EN_RUTA y tienen etaEstimado
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (desde || hasta) {
      where.fechaRuta = {};
      if (desde) where.fechaRuta.gte = new Date(desde);
      if (hasta) where.fechaRuta.lte = new Date(hasta);
    }

    if (proyectoId) {
      where.proyectoId = proyectoId;
    }

    // Solo ordenes que ya llegaron (ARMADO_INICIADO o posterior)
    where.fechaInicioArmado = { not: null };
    where.fechaRuta = { ...where.fechaRuta, not: null };

    const ordenes = await prisma.orden.findMany({
      where,
      select: {
        id: true,
        codigoReferenciaRetail: true,
        fechaRuta: true,
        fechaInicioArmado: true,
        armador: {
          select: {
            usuario: { select: { nombre: true } },
          },
        },
        registrosEstado: {
          where: {
            estadoCambiadoA: "EN_RUTA",
            etaEstimado: { not: null },
          },
          select: {
            etaEstimado: true,
            timestamp: true,
          },
          orderBy: { timestamp: "desc" },
          take: 1,
        },
      },
      orderBy: { fechaRuta: "desc" },
      take: 200,
    });

    const desglose: Array<{
      ordenId: string;
      codigo: string;
      armador: string;
      etaEstimadoMin: number;
      tiempoRealMin: number;
      desviacionMin: number;
    }> = [];

    let totalDesviacion = 0;
    let dentroDeVentana = 0;

    for (const orden of ordenes) {
      const registroEnRuta = orden.registrosEstado[0];
      if (!registroEnRuta?.etaEstimado || !orden.fechaRuta || !orden.fechaInicioArmado) {
        continue;
      }

      // ETA predicho: desde que salio EN_RUTA hasta etaEstimado
      const etaEstimadoMs = registroEnRuta.etaEstimado.getTime() - registroEnRuta.timestamp.getTime();
      const etaEstimadoMin = Math.round(etaEstimadoMs / 60000);

      // Tiempo real: desde EN_RUTA hasta ARMADO_INICIADO (llegada)
      const tiempoRealMs = orden.fechaInicioArmado.getTime() - orden.fechaRuta.getTime();
      const tiempoRealMin = Math.round(tiempoRealMs / 60000);

      const desviacionMin = tiempoRealMin - etaEstimadoMin;

      desglose.push({
        ordenId: orden.id,
        codigo: orden.codigoReferenciaRetail,
        armador: orden.armador?.usuario?.nombre || "Sin armador",
        etaEstimadoMin,
        tiempoRealMin,
        desviacionMin,
      });

      totalDesviacion += Math.abs(desviacionMin);
      if (Math.abs(desviacionMin) <= 15) {
        dentroDeVentana++;
      }
    }

    const totalOrdenes = desglose.length;
    const promedioDesviacionMin = totalOrdenes > 0
      ? Math.round(totalDesviacion / totalOrdenes)
      : 0;
    const dentroDeVentana15Min = totalOrdenes > 0
      ? Math.round((dentroDeVentana / totalOrdenes) * 100)
      : 0;

    return NextResponse.json({
      totalOrdenes,
      promedioDesviacionMin,
      dentroDeVentana15Min,
      desglose,
    });
  } catch (error) {
    console.error("Error en reporte eta-precision:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
