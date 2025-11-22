import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EstadoOrden } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

type FiltrosReporte = {
  desde?: string;
  hasta?: string;
  proyectoId?: string;
  estado?: EstadoOrden;
  armadorId?: string;
};

type TiempoPorEstado = {
  [key in EstadoOrden]?: number; // Tiempo en segundos
};

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

export async function GET(request: Request) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const desdeParam = searchParams.get('desde');
    const hastaParam = searchParams.get('hasta');
    const proyectoId = searchParams.get('proyectoId') || undefined;
    const estado = searchParams.get('estado') as EstadoOrden | null;
    const armadorId = searchParams.get('armadorId') || undefined;

    // Validar fechas
    const desde = desdeParam ? new Date(desdeParam) : undefined;
    const hasta = hastaParam ? new Date(hastaParam) : undefined;

    if ((desdeParam && isNaN(desde?.getTime())) || (hastaParam && isNaN(hasta?.getTime()))) {
      return NextResponse.json(
        { error: 'Formato de fecha inválido. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Construir filtros para la consulta
    const whereClause: any = {
      ...(proyectoId && { proyectoId }),
      ...(estado && { estado }),
      ...(armadorId && { armadorId }),
      ...(desde || hasta
        ? {
            OR: [
              // Filtrar por fechas de creación o fechas de modificación
              {
                updatedAt: {
                  ...(desde && { gte: desde }),
                  ...(hasta && { lte: hasta }),
                },
              },
              {
                fechaCreacion: {
                  ...(desde && { gte: desde }),
                  ...(hasta && { lte: hasta }),
                },
              },
            ],
          }
        : {}),
    };

    // Obtener las órdenes con sus registros de estado
    const ordenes = await prisma.orden.findMany({
      where: whereClause,
      include: {
        registrosEstado: {
          orderBy: { timestamp: 'asc' },
        },
        proyecto: {
          select: { nombreComercial: true },
        },
        armador: {
          select: { nombre: true, apellido: true },
        },
      },
      orderBy: { fechaCreacion: 'desc' },
    });

    // Procesar los datos para calcular los tiempos por estado
    const resultados: ResultadoReporte[] = [];

    for (const orden of ordenes) {
      // Ordenar los registros de estado por timestamp
      const registrosOrdenados = [...orden.registrosEstado].sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
      );

      const tiemposPorEstado: TiempoPorEstado = {};
      let tiempoTotal = 0;

      // Calcular tiempo en cada estado
      for (let i = 0; i < registrosOrdenados.length - 1; i++) {
        const registroActual = registrosOrdenados[i];
        const siguienteRegistro = registrosOrdenados[i + 1];

        if (registroActual.estadoCambiadoA) {
          const duracion =
            (siguienteRegistro.timestamp.getTime() -
              registroActual.timestamp.getTime()) /
            1000; // Convertir a segundos

          // Acumular tiempo por estado
          if (!tiemposPorEstado[registroActual.estadoCambiadoA]) {
            tiemposPorEstado[registroActual.estadoCambiadoA] = 0;
          }
          tiemposPorEstado[registroActual.estadoCambiadoA]! += duracion;
          tiempoTotal += duracion;
        }
      }

      // Procesar el último registro si es necesario
      if (registrosOrdenados.length > 0) {
        const ultimoRegistro = registrosOrdenados[registrosOrdenados.length - 1];
        if (ultimoRegistro.estadoCambiadoA && ultimoRegistro.estadoCambiadoA !== 'CANCELADA') {
          const tiempoActual = new Date().getTime();
          const duracion = (tiempoActual - ultimoRegistro.timestamp.getTime()) / 1000;
          
          if (!tiemposPorEstado[ultimoRegistro.estadoCambiadoA]) {
            tiemposPorEstado[ultimoRegistro.estadoCambiadoA] = 0;
          }
          tiemposPorEstado[ultimoRegistro.estadoCambiadoA]! += duracion;
          tiempoTotal += duracion;
        }
      }

      // Formatear resultado para esta orden
      resultados.push({
        ordenId: orden.id,
        codigoReferenciaRetail: orden.codigoReferenciaRetail,
        proyecto: orden.proyecto.nombreComercial,
        armador: orden.armador ? `${orden.armador.nombre} ${orden.armador.apellido}` : undefined,
        estadoActual: orden.estado,
        fechaCreacion: orden.fechaCreacion,
        fechaCompletado: orden.fechaCompletado || undefined,
        tiemposPorEstado,
        tiempoTotal,
      });
    }

    return NextResponse.json(resultados);
  } catch (error) {
    console.error('Error al generar el reporte de tiempos por pedido:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al generar el reporte' },
      { status: 500 }
    );
  }
}

// Función auxiliar para formatear segundos a un string legible
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
