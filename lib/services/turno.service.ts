import { BaseService } from './base.service';
import { Turno, RutaPunto, TipoPunto, EstadoTurno, PrismaClient } from '@prisma/client';

type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export interface Coordenadas {
  lat: number;
  lng: number;
}

export interface IniciarTurnoParams {
  armadorId: string;
  ubicacion: Coordenadas;
  descripcion?: string;
}

export interface GuardarUbicacionParams {
  turnoId: string;
  ubicacion: Coordenadas;
  tipo?: TipoPunto;
}

export interface FinalizarTurnoParams {
  turnoId: string;
  ubicacionFinal?: Coordenadas;
  observaciones?: string;
}

export interface TurnoConRuta extends Turno {
  rutaPuntos: RutaPunto[];
  armador: {
    id: string;
    usuario: {
      nombre: string;
      fotoPerfil: string | null;
    };
  };
}

export interface EstadisticasTurno {
  distanciaTotal: number;
  duracion: number;
  numeroParadas: number;
  velocidadPromedio: number;
}

/**
 * Servicio para gestión de turnos de armadores
 */
export class TurnoService extends BaseService {
  /**
   * Iniciar un nuevo turno
   */
  async iniciarTurno(params: IniciarTurnoParams): Promise<Turno> {
    try {
      const { armadorId, ubicacion, descripcion } = params;

      // Verificar que no hay turno activo
      const turnoActivo = await this.prisma.turno.findFirst({
        where: {
          armadorId,
          estado: 'ACTIVO',
        },
      });

      if (turnoActivo) {
        throw new Error('Ya existe un turno activo para este armador');
      }

      // Crear turno con transacción
      const turno = await this.prisma.$transaction(async (tx: TransactionClient) => {
        // 1. Crear turno
        const nuevoTurno = await tx.turno.create({
          data: {
            armadorId,
            estado: 'ACTIVO',
            inicioTurno: new Date(),
          },
        });

        // 2. Crear punto inicial
        await tx.rutaPunto.create({
          data: {
            turnoId: nuevoTurno.id,
            latitud: ubicacion.lat,
            longitud: ubicacion.lng,
            tipo: 'INICIO',
            descripcion,
            timestamp: new Date(),
          },
        });

        // 3. Actualizar ubicación actual del armador
        await tx.armador.update({
          where: { id: armadorId },
          data: {
            ubicacionActualLat: ubicacion.lat,
            ubicacionActualLng: ubicacion.lng,
            ultimaActualizacionGPS: new Date(),
          },
        });

        return nuevoTurno;
      });

      return turno;
    } catch (error) {
      return this.handlePrismaError(error);
    }
  }

  /**
   * Guardar ubicación durante el turno (con smart sampling)
   */
  async guardarUbicacion(params: GuardarUbicacionParams): Promise<RutaPunto | null> {
    try {
      const { turnoId, ubicacion, tipo = 'INTERMEDIO' } = params;

      // Validar que el turno existe y está activo
      const turno = await this.prisma.turno.findUnique({
        where: { id: turnoId },
      });

      if (!turno) {
        throw new Error('Turno no encontrado');
      }

      if (turno.estado !== 'ACTIVO') {
        throw new Error('El turno no está activo');
      }

      // Obtener último punto para smart sampling
      const ultimoPunto = await this.prisma.rutaPunto.findFirst({
        where: { turnoId },
        orderBy: { timestamp: 'desc' },
      });

      // Smart sampling: guardar si movimiento > 20 metros O si pasaron más de 2 minutos
      if (ultimoPunto && tipo === 'INTERMEDIO') {
        const distancia = this.calcularDistancia(
          { lat: ultimoPunto.latitud, lng: ultimoPunto.longitud },
          ubicacion
        );

        const umbralMetros = parseInt(process.env.TRACKING_MIN_DISTANCE || '20');
        const tiempoDesdeUltimo = Date.now() - ultimoPunto.timestamp.getTime();
        const umbralTiempoMs = 2 * 60 * 1000; // 2 minutos

        // Guardar si: movimiento > umbral O tiempo > 2 min
        const debeGuardar = distancia >= umbralMetros || tiempoDesdeUltimo >= umbralTiempoMs;

        if (!debeGuardar) {
          // Solo actualizar ubicación del armador, no guardar punto
          await this.prisma.armador.update({
            where: { id: turno.armadorId },
            data: {
              ubicacionActualLat: ubicacion.lat,
              ubicacionActualLng: ubicacion.lng,
              ultimaActualizacionGPS: new Date(),
            },
          });
          return null; // Punto omitido por smart sampling
        }
      }

      // Guardar punto con transacción
      const punto = await this.prisma.$transaction(async (tx: TransactionClient) => {
        const nuevoPunto = await tx.rutaPunto.create({
          data: {
            turnoId,
            latitud: ubicacion.lat,
            longitud: ubicacion.lng,
            tipo,
            timestamp: new Date(),
          },
        });

        await tx.armador.update({
          where: { id: turno.armadorId },
          data: {
            ubicacionActualLat: ubicacion.lat,
            ubicacionActualLng: ubicacion.lng,
            ultimaActualizacionGPS: new Date(),
          },
        });

        return nuevoPunto;
      });

      return punto;
    } catch (error) {
      return this.handlePrismaError(error);
    }
  }

  /**
   * Finalizar turno
   */
  async finalizarTurno(params: FinalizarTurnoParams): Promise<Turno> {
    try {
      const { turnoId, ubicacionFinal, observaciones: _observaciones } = params;

      const turno = await this.prisma.turno.findUnique({
        where: { id: turnoId },
        include: {
          rutaPuntos: {
            orderBy: { timestamp: 'asc' },
          },
        },
      });

      if (!turno) {
        throw new Error('Turno no encontrado');
      }

      if (turno.estado !== 'ACTIVO') {
        throw new Error('El turno no está activo');
      }

      // Calcular estadísticas
      const _estadisticas = this.calcularEstadisticas(turno.rutaPuntos);

      // Finalizar con transacción
      const turnoFinalizado = await this.prisma.$transaction(async (tx: TransactionClient) => {
        // Crear punto final si hay ubicación
        if (ubicacionFinal) {
          await tx.rutaPunto.create({
            data: {
              turnoId,
              latitud: ubicacionFinal.lat,
              longitud: ubicacionFinal.lng,
              tipo: 'FIN',
              timestamp: new Date(),
            },
          });
        }

        // Actualizar turno
        const actualizado = await tx.turno.update({
          where: { id: turnoId },
          data: {
            estado: 'FINALIZADO',
            finTurno: new Date(),
          },
        });

        return actualizado;
      });

      return turnoFinalizado;
    } catch (error) {
      return this.handlePrismaError(error);
    }
  }

  /**
   * Obtener turno activo de un armador
   */
  async obtenerTurnoActivo(armadorId: string): Promise<Turno | null> {
    try {
      const turno = await this.prisma.turno.findFirst({
        where: {
          armadorId,
          estado: 'ACTIVO',
        },
        include: {
          rutaPuntos: {
            orderBy: { timestamp: 'desc' },
            take: 1,
          },
        },
      });

      return turno;
    } catch (error) {
      return this.handlePrismaError(error);
    }
  }

  /**
   * Obtener ruta completa de un turno
   */
  async obtenerRuta(turnoId: string): Promise<TurnoConRuta> {
    try {
      const turno = await this.prisma.turno.findUnique({
        where: { id: turnoId },
        include: {
          rutaPuntos: {
            orderBy: { timestamp: 'asc' },
          },
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
        },
      });

      if (!turno) {
        throw new Error('Turno no encontrado');
      }

      return turno as TurnoConRuta;
    } catch (error) {
      return this.handlePrismaError(error);
    }
  }

  /**
   * Listar turnos de un armador
   */
  async listarTurnosArmador(params: {
    armadorId: string;
    limite?: number;
    desde?: Date;
    hasta?: Date;
    estado?: EstadoTurno;
  }): Promise<Turno[]> {
    try {
      const { armadorId, limite = 20, desde, hasta, estado } = params;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = { armadorId };

      if (estado) {
        where.estado = estado;
      }

      if (desde || hasta) {
        where.inicioTurno = {};
        if (desde) where.inicioTurno.gte = desde;
        if (hasta) where.inicioTurno.lte = hasta;
      }

      const turnos = await this.prisma.turno.findMany({
        where,
        take: limite,
        orderBy: { inicioTurno: 'desc' },
        include: {
          _count: {
            select: { rutaPuntos: true },
          },
        },
      });

      return turnos;
    } catch (error) {
      return this.handlePrismaError(error);
    }
  }

  /**
   * Obtener todos los turnos activos (para dashboard admin)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async obtenerTurnosActivos(): Promise<any[]> {
    try {
      const turnos = await this.prisma.turno.findMany({
        where: { estado: 'ACTIVO' },
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
                    in: ['ASIGNADO', 'EN_RUTA', 'ARMADO_INICIADO'],
                  },
                },
              },
            },
          },
          _count: {
            select: { rutaPuntos: true },
          },
        },
        orderBy: { inicioTurno: 'desc' },
      });

      return turnos
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((t: any) => t.armador)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((turno: any) => ({
          id: turno.id,
          armadorId: turno.armadorId,
          armadorNombre: turno.armador.usuario.nombre,
          armadorTelefono: turno.armador.usuario.telefono,
          estadoLoggeo: turno.armador.usuario.estadoLoggeo,
          inicioTurno: turno.inicioTurno,
          duracionMinutos: Math.floor(
            (Date.now() - turno.inicioTurno.getTime()) / 1000 / 60
          ),
          ordenesActivas: turno.armador.ordenes.length,
          totalPuntosRuta: turno._count.rutaPuntos,
          ubicacionActual: turno.armador.ubicacionActualLat
            ? {
                lat: turno.armador.ubicacionActualLat,
                lng: turno.armador.ubicacionActualLng,
              }
            : null,
        }));
    } catch (error) {
      return this.handlePrismaError(error);
    }
  }

  /**
   * Calcular distancia entre dos coordenadas (fórmula Haversine)
   */
  private calcularDistancia(coord1: Coordenadas, coord2: Coordenadas): number {
    const R = 6371000; // Radio de la Tierra en metros
    const φ1 = (coord1.lat * Math.PI) / 180;
    const φ2 = (coord2.lat * Math.PI) / 180;
    const Δφ = ((coord2.lat - coord1.lat) * Math.PI) / 180;
    const Δλ = ((coord2.lng - coord1.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Calcular estadísticas del turno
   */
  private calcularEstadisticas(puntos: RutaPunto[]): EstadisticasTurno {
    if (puntos.length < 2) {
      return {
        distanciaTotal: 0,
        duracion: 0,
        numeroParadas: 0,
        velocidadPromedio: 0,
      };
    }

    let distanciaTotal = 0;
    let numeroParadas = 0;

    for (let i = 1; i < puntos.length; i++) {
      const distancia = this.calcularDistancia(
        { lat: puntos[i - 1].latitud, lng: puntos[i - 1].longitud },
        { lat: puntos[i].latitud, lng: puntos[i].longitud }
      );
      distanciaTotal += distancia;

      if (puntos[i].tipo === 'PARADA') {
        numeroParadas++;
      }
    }

    const inicio = puntos[0].timestamp;
    const fin = puntos[puntos.length - 1].timestamp;
    const duracion = (fin.getTime() - inicio.getTime()) / 1000 / 60;

    const velocidadPromedio =
      duracion > 0 ? (distanciaTotal / 1000 / (duracion / 60)) : 0;

    return {
      distanciaTotal: Math.round(distanciaTotal),
      duracion: Math.round(duracion),
      numeroParadas,
      velocidadPromedio: Math.round(velocidadPromedio * 10) / 10,
    };
  }
}

// Exportar instancia singleton
export const turnoService = new TurnoService();
