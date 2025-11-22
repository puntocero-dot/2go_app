import { prisma } from './prisma';

export async function getProyectosParaFiltros() {
  return prisma.proyecto.findMany({
    select: {
      id: true,
      nombreComercial: true,
    },
    orderBy: {
      nombreComercial: 'asc',
    },
  });
}

export async function getArmadoresParaFiltros() {
  return prisma.armador.findMany({
    select: {
      id: true,
      nombre: true,
      apellido: true,
    },
    orderBy: [
      { nombre: 'asc' },
      { apellido: 'asc' },
    ],
  });
}

export type EstadoOrden = 
  | 'SIN_ASIGNAR'
  | 'ASIGNADO'
  | 'EN_RUTA'
  | 'ARMADO_INICIADO'
  | 'ARMADO_FINALIZADO'
  | 'ARMADO_COMPLETADO'
  | 'CANCELADA';

export interface ResultadoReporte {
  ordenId: string;
  codigoReferenciaRetail: string;
  proyecto: string;
  armador?: string;
  estadoActual: EstadoOrden;
  fechaCreacion: string;
  fechaCompletado?: string;
  tiemposPorEstado: Record<EstadoOrden, number>;
  tiempoTotal: number;
}
