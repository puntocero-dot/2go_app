import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { EstadoOrden } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { withRateLimit } from "@/lib/api-helpers";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { ReporteTiemposPedidoFiltrosSchema } from "@/lib/schemas/reportes.schemas";
import { logAuditFromSession } from "@/lib/audit-logger";

type TiempoPorEstado = Record<string, number>; // Tiempo en segundos por estado

type ResultadoReporte = {
  ordenId: string;
  codigoReferenciaRetail: string;
  proyecto: string;
  armador?: string;
  estadoActual: EstadoOrden;
  fechaCreacion: Date;
  fechaCompletado?: Date;
  tiemposPorEstado: TiempoPorEstado;
  tiempoTotal: number; // en segundos
};

const tiemposPedidoHandler = async (request: NextRequest) => {
  try {
    const session = await getSession();
    if (!session || session.rol !== "ADMIN") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const rawFilters = {
      desde: searchParams.get('desde') || undefined,
      hasta: searchParams.get('hasta') || undefined,
      proyectoId: searchParams.get('proyectoId') || undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      estado: (searchParams.get('estado') || undefined) as any,
      armadorId: searchParams.get('armadorId') || undefined,
    };

    const parsed = ReporteTiemposPedidoFiltrosSchema.safeParse(rawFilters);

    if (!parsed.success) {
      const detalles = parsed.error.flatten();
      return NextResponse.json(
        { error: "Parámetros de filtro inválidos", detalles },
        { status: 400 },
      );
    }

    const { desde, hasta, proyectoId, estado, armadorId } = parsed.data;

    const desdeDate = desde ? new Date(desde) : undefined;
    const hastaDate = hasta ? new Date(hasta) : undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {
      ...(proyectoId && { proyectoId }),
      ...(estado && { estado: estado as EstadoOrden }),
      ...(armadorId && { armadorId }),
      ...(desdeDate || hastaDate
        ? {
            OR: [
              {
                updatedAt: {
                  ...(desdeDate && { gte: desdeDate }),
                  ...(hastaDate && { lte: hastaDate }),
                },
              },
              {
                fechaCreacion: {
                  ...(desdeDate && { gte: desdeDate }),
                  ...(hastaDate && { lte: hastaDate }),
                },
              },
            ],
          }
        : {}),
    };

    const ordenes = await prisma.orden.findMany({
      where: whereClause,
      include: {
        registrosEstado: {
          orderBy: { timestamp: "asc" },
        },
        proyecto: {
          select: { nombreComercial: true },
        },
        armador: {
          include: {
            usuario: {
              select: {
                nombre: true,
              },
            },
          },
        },
      },
      orderBy: { fechaCreacion: "desc" },
    });

    const resultados: ResultadoReporte[] = [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const orden of ordenes as any[]) {
      let tiemposPorEstado: TiempoPorEstado = {};
      let tiempoTotal = 0;

      // Usar datos pre-computados si existen (campo tiempoAcumuladoEstados)
      if (orden.tiempoAcumuladoEstados && typeof orden.tiempoAcumuladoEstados === "object") {
        tiemposPorEstado = orden.tiempoAcumuladoEstados as TiempoPorEstado;
        tiempoTotal = Object.values(tiemposPorEstado).reduce((acc: number, val) => acc + (val as number), 0);
      } else {
        // Fallback: calcular desde registrosEstado para ordenes sin datos pre-computados
        const registrosOrdenados = [...orden.registrosEstado].sort(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (a: any, b: any) => a.timestamp.getTime() - b.timestamp.getTime()
        );

        for (let i = 0; i < registrosOrdenados.length - 1; i++) {
          const registroActual = registrosOrdenados[i];
          const siguienteRegistro = registrosOrdenados[i + 1];

          if (registroActual.estadoCambiadoA) {
            const duracion =
              (siguienteRegistro.timestamp.getTime() -
                registroActual.timestamp.getTime()) /
              1000;

            if (!tiemposPorEstado[registroActual.estadoCambiadoA]) {
              tiemposPorEstado[registroActual.estadoCambiadoA] = 0;
            }
            tiemposPorEstado[registroActual.estadoCambiadoA] += duracion;
            tiempoTotal += duracion;
          }
        }

        if (registrosOrdenados.length > 0) {
          const ultimoRegistro = registrosOrdenados[registrosOrdenados.length - 1];
          if (ultimoRegistro.estadoCambiadoA && ultimoRegistro.estadoCambiadoA !== 'CANCELADA') {
            const tiempoActual = new Date().getTime();
            const duracion = (tiempoActual - ultimoRegistro.timestamp.getTime()) / 1000;

            if (!tiemposPorEstado[ultimoRegistro.estadoCambiadoA]) {
              tiemposPorEstado[ultimoRegistro.estadoCambiadoA] = 0;
            }
            tiemposPorEstado[ultimoRegistro.estadoCambiadoA] += duracion;
            tiempoTotal += duracion;
          }
        }
      }

      // Formatear resultado para esta orden
      resultados.push({
        ordenId: orden.id,
        codigoReferenciaRetail: orden.codigoReferenciaRetail,
        proyecto: orden.proyecto.nombreComercial,
        armador: orden.armador?.usuario?.nombre ?? undefined,
        estadoActual: orden.estado,
        fechaCreacion: orden.fechaCreacion,
        fechaCompletado: orden.fechaCompletado || undefined,
        tiemposPorEstado,
        tiempoTotal,
      });
    }

    await logAuditFromSession({
      session,
      action: 'EXPORT_DATA',
      resource: 'sistema',
      resourceId: proyectoId || undefined,
      metadata: {
        tipo: 'REPORTE_TIEMPOS_PEDIDO',
        filtros: parsed.data,
        totalOrdenes: ordenes.length,
      },
      request,
    });

    return NextResponse.json(resultados);
  } catch (error) {
    console.error('Error al generar el reporte de tiempos por pedido:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al generar el reporte' },
      { status: 500 }
    );
  }
};

// Función auxiliar para formatear segundos a un string legible
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function formatSeconds(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  
  return parts.join(' ');
}

export const GET = withRateLimit(
  tiemposPedidoHandler,
  RATE_LIMITS.DEFAULT,
  (request) => {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    return `reporte-tiempos:${ip}`;
  }
);
