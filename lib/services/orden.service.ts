import { BaseService } from './base.service';
import { Orden, EstadoOrden, Prisma, PrismaClient } from '@prisma/client';

type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export interface FiltrarOrdenesParams {
  proyectoId?: string;
  estado?: EstadoOrden;
  armadorId?: string;
  desde?: Date;
  hasta?: Date;
  page?: number;
  limit?: number;
  proyectoIdsPermitidos?: string[];
}

export interface OrdenConRelaciones extends Orden {
  armador?: {
    id: string;
    usuario: {
      nombre: string;
      fotoPerfil: string | null;
    };
  } | null;
  proyecto: {
    id: string;
    nombreComercial: string;
  };
  usuarioFinal: {
    nombre: string;
    direccionCompleta: string;
    municipio: string;
    coordenadasLat: number | null;
    coordenadasLng: number | null;
  };
  mueble: {
    nombre: string;
    tamano: string;
  };
}

/**
 * Servicio para gestión de órdenes
 */
export class OrdenService extends BaseService {
  /**
   * Obtener orden por ID con relaciones
   */
  async obtenerPorId(id: string): Promise<OrdenConRelaciones | null> {
    try {
      const orden = await this.prisma.orden.findUnique({
        where: { id },
        include: {
          armador: {
            include: {
              usuario: {
                select: {
                  nombre: true,
                  fotoPerfil: true,
                  telefono: true,
                },
              },
            },
          },
          proyecto: {
            select: {
              id: true,
              nombreComercial: true,
            },
          },
          usuarioFinal: {
            select: {
              nombre: true,
              direccionCompleta: true,
              municipio: true,
              telefono: true,
              coordenadasLat: true,
              coordenadasLng: true,
            },
          },
          mueble: {
            select: {
              nombre: true,
              tamano: true,
            },
          },
        },
      });

      return orden as OrdenConRelaciones | null;
    } catch (error) {
      return this.handlePrismaError(error);
    }
  }

  /**
   * Listar órdenes con filtros y paginación
   */
  async listar(params: FiltrarOrdenesParams): Promise<{
    ordenes: OrdenConRelaciones[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const {
        proyectoId,
        estado,
        armadorId,
        desde,
        hasta,
        page = 1,
        limit = 20,
        proyectoIdsPermitidos,
      } = params;

      const skip = (page - 1) * limit;

      const where: Prisma.OrdenWhereInput = {};

      if (proyectoId) {
        where.proyectoId = proyectoId;
      }

      if (proyectoIdsPermitidos && proyectoIdsPermitidos.length > 0) {
        where.proyectoId = { in: proyectoIdsPermitidos };
      }

      if (estado) {
        where.estado = estado;
      }

      if (armadorId) {
        where.armadorId = armadorId;
      }

      if (desde || hasta) {
        where.fechaCreacion = {};
        if (desde) where.fechaCreacion.gte = desde;
        if (hasta) where.fechaCreacion.lte = hasta;
      }

      const [ordenes, total] = await Promise.all([
        this.prisma.orden.findMany({
          where,
          skip,
          take: limit,
          orderBy: { fechaCreacion: 'desc' },
          include: {
            armador: {
              include: {
                usuario: {
                  select: {
                    nombre: true,
                    fotoPerfil: true,
                  },
                },
              },
            },
            proyecto: {
              select: {
                id: true,
                nombreComercial: true,
              },
            },
            usuarioFinal: {
              select: {
                nombre: true,
                direccionCompleta: true,
                municipio: true,
                coordenadasLat: true,
                coordenadasLng: true,
              },
            },
            mueble: {
              select: {
                nombre: true,
                tamano: true,
              },
            },
          },
        }),
        this.prisma.orden.count({ where }),
      ]);

      return {
        ordenes: ordenes as OrdenConRelaciones[],
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      return this.handlePrismaError(error);
    }
  }

  /**
   * Asignar armador a orden
   */
  async asignarArmador(ordenId: string, armadorId: string): Promise<Orden> {
    try {
      // Validar que la orden existe
      const orden = await this.prisma.orden.findUnique({
        where: { id: ordenId },
      });

      if (!orden) {
        throw new Error('Orden no encontrada');
      }

      if (orden.estado !== 'SIN_ASIGNAR') {
        throw new Error('La orden ya tiene un armador asignado');
      }

      // Validar que el armador existe y está activo
      const armador = await this.prisma.armador.findUnique({
        where: { id: armadorId },
        include: { usuario: true },
      });

      if (!armador || !armador.usuario.activo) {
        throw new Error('Armador no disponible');
      }

      // Asignar con transacción
      const ordenActualizada = await this.prisma.$transaction(async (tx: TransactionClient) => {
        const actualizada = await tx.orden.update({
          where: { id: ordenId },
          data: {
            armadorId,
            estado: 'ASIGNADO',
            fechaAsignacion: new Date(),
          },
        });

        // Registrar cambio de estado
        await tx.registroEstado.create({
          data: {
            ordenId,
            estadoAnterior: orden.estado,
            estadoNuevo: 'ASIGNADO',
            estadoCambiadoA: 'ASIGNADO',
            comentario: `Armador asignado: ${armador.usuario.nombre}`,
            timestamp: new Date(),
          },
        });

        return actualizada;
      });

      return ordenActualizada;
    } catch (error) {
      return this.handlePrismaError(error);
    }
  }

  /**
   * Cambiar estado de orden
   */
  async cambiarEstado(
    ordenId: string,
    nuevoEstado: EstadoOrden,
    usuarioId?: string,
    comentario?: string,
    ubicacion?: { lat: number; lng: number }
  ): Promise<Orden> {
    try {
      const orden = await this.prisma.orden.findUnique({
        where: { id: ordenId },
      });

      if (!orden) {
        throw new Error('Orden no encontrada');
      }

      // Validar transición de estados
      this.validarTransicionEstado(orden.estado, nuevoEstado);

      // Preparar datos de actualización
      const updateData: Prisma.OrdenUpdateInput = {
        estado: nuevoEstado,
      };

      // Actualizar fechas según el estado
      switch (nuevoEstado) {
        case 'EN_RUTA':
          updateData.fechaRuta = new Date();
          break;
        case 'ARMADO_INICIADO':
          updateData.fechaInicioArmado = new Date();
          break;
        case 'ARMADO_FINALIZADO':
        case 'ARMADO_COMPLETADO':
          updateData.fechaFinArmado = new Date();
          updateData.fechaCompletado = new Date();
          break;
      }

      // Actualizar con transacción
      const ordenActualizada = await this.prisma.$transaction(async (tx: TransactionClient) => {
        const actualizada = await tx.orden.update({
          where: { id: ordenId },
          data: updateData,
        });

        // Registrar cambio de estado
        await tx.registroEstado.create({
          data: {
            ordenId,
            estadoAnterior: orden.estado,
            estadoNuevo: nuevoEstado,
            estadoCambiadoA: nuevoEstado,
            usuarioId,
            comentario,
            latitud: ubicacion?.lat,
            longitud: ubicacion?.lng,
            timestamp: new Date(),
          },
        });

        return actualizada;
      });

      return ordenActualizada;
    } catch (error) {
      return this.handlePrismaError(error);
    }
  }

  /**
   * Obtener órdenes activas de un armador
   */
  async obtenerOrdenesArmador(armadorId: string): Promise<OrdenConRelaciones[]> {
    try {
      const ordenes = await this.prisma.orden.findMany({
        where: {
          armadorId,
          estado: {
            in: ['ASIGNADO', 'EN_RUTA', 'ARMADO_INICIADO'],
          },
        },
        include: {
          proyecto: {
            select: {
              id: true,
              nombreComercial: true,
            },
          },
          usuarioFinal: {
            select: {
              nombre: true,
              direccionCompleta: true,
              municipio: true,
              telefono: true,
              coordenadasLat: true,
              coordenadasLng: true,
            },
          },
          mueble: {
            select: {
              nombre: true,
              tamano: true,
            },
          },
        },
        orderBy: { fechaCreacion: 'asc' },
      });

      return ordenes as unknown as OrdenConRelaciones[];
    } catch (error) {
      return this.handlePrismaError(error);
    }
  }

  /**
   * Obtener estadísticas de órdenes
   */
  async obtenerEstadisticas(params?: {
    proyectoId?: string;
    desde?: Date;
    hasta?: Date;
  }): Promise<{
    total: number;
    porEstado: Record<EstadoOrden, number>;
    completadasHoy: number;
    tiempoPromedioMinutos: number;
  }> {
    try {
      const where: Prisma.OrdenWhereInput = {};

      if (params?.proyectoId) {
        where.proyectoId = params.proyectoId;
      }

      if (params?.desde || params?.hasta) {
        where.fechaCreacion = {};
        if (params.desde) where.fechaCreacion.gte = params.desde;
        if (params.hasta) where.fechaCreacion.lte = params.hasta;
      }

      const [total, porEstado, completadasHoy, ordenesCompletadas] =
        await Promise.all([
          this.prisma.orden.count({ where }),
          this.prisma.orden.groupBy({
            by: ['estado'],
            where,
            _count: true,
          }),
          this.prisma.orden.count({
            where: {
              ...where,
              estado: 'ARMADO_COMPLETADO',
              fechaCompletado: {
                gte: new Date(new Date().setHours(0, 0, 0, 0)),
              },
            },
          }),
          this.prisma.orden.findMany({
            where: {
              ...where,
              estado: 'ARMADO_COMPLETADO',
              fechaCompletado: { not: null },
              fechaCreacion: { not: undefined },
            },
            select: {
              fechaCreacion: true,
              fechaCompletado: true,
            },
            take: 100,
          }),
        ]);

      // Calcular tiempo promedio
      let tiempoPromedioMinutos = 0;
      if (ordenesCompletadas.length > 0) {
        const tiempos = ordenesCompletadas.map((o: { fechaCreacion: Date; fechaCompletado: Date | null }) =>
          o.fechaCompletado && o.fechaCreacion
            ? (o.fechaCompletado.getTime() - o.fechaCreacion.getTime()) / 1000 / 60
            : 0
        );
        tiempoPromedioMinutos =
          tiempos.reduce((a: number, b: number) => a + b, 0) / tiempos.length;
      }

      // Convertir groupBy a Record
      const estadosRecord: Record<EstadoOrden, number> = {
        SIN_ASIGNAR: 0,
        ASIGNADO: 0,
        EN_RUTA: 0,
        ARMADO_INICIADO: 0,
        ARMADO_FINALIZADO: 0,
        ARMADO_COMPLETADO: 0,
        CANCELADA: 0,
      };

      porEstado.forEach((e: { estado: EstadoOrden; _count: number }) => {
        estadosRecord[e.estado] = e._count;
      });

      return {
        total,
        porEstado: estadosRecord,
        completadasHoy,
        tiempoPromedioMinutos: Math.round(tiempoPromedioMinutos),
      };
    } catch (error) {
      return this.handlePrismaError(error);
    }
  }

  /**
   * Validar transición de estados permitida
   */
  private validarTransicionEstado(
    estadoActual: EstadoOrden,
    nuevoEstado: EstadoOrden
  ): void {
    const transicionesPermitidas: Record<EstadoOrden, EstadoOrden[]> = {
      SIN_ASIGNAR: ['ASIGNADO', 'CANCELADA'],
      ASIGNADO: ['EN_RUTA', 'SIN_ASIGNAR', 'CANCELADA'],
      EN_RUTA: ['ARMADO_INICIADO', 'CANCELADA'],
      ARMADO_INICIADO: ['ARMADO_FINALIZADO', 'ARMADO_COMPLETADO', 'CANCELADA'],
      ARMADO_FINALIZADO: ['ARMADO_COMPLETADO'],
      ARMADO_COMPLETADO: [],
      CANCELADA: [],
    };

    const permitidas = transicionesPermitidas[estadoActual];
    if (!permitidas.includes(nuevoEstado)) {
      throw new Error(
        `No se puede cambiar de ${estadoActual} a ${nuevoEstado}`
      );
    }
  }
}

// Exportar instancia singleton
export const ordenService = new OrdenService();
