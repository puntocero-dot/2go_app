import { BaseService } from './base.service';
import { Usuario, RolUsuario, Prisma, PrismaClient, EstadoLoggeo } from '@prisma/client';
import { hashPassword } from '@/lib/auth';

type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export interface CrearUsuarioParams {
  email: string;
  password: string;
  nombre: string;
  telefono?: string;
  rol: RolUsuario;
  fotoPerfil?: string;
  habilidades?: string[];
  proyectosIds?: string[];
}

export interface ActualizarUsuarioParams {
  nombre?: string;
  telefono?: string;
  fotoPerfil?: string;
  rol?: RolUsuario;
  activo?: boolean;
  habilidades?: string[];
  proyectosIds?: string[];
}

export interface UsuarioConRelaciones extends Usuario {
  armador?: {
    id: string;
    estado: string;
    habilidades: string[];
  } | null;
  supervisorProyectos?: {
    proyectoId: string;
    proyecto: {
      nombreComercial: string;
    };
  }[];
}

/**
 * Servicio para gestión de usuarios
 */
export class UsuarioService extends BaseService {
  /**
   * Crear nuevo usuario
   */
  async crear(params: CrearUsuarioParams): Promise<UsuarioConRelaciones> {
    try {
      const { email, password, nombre, telefono, rol, fotoPerfil, habilidades, proyectosIds } = params;

      // Validar que el email no existe
      const existente = await this.prisma.usuario.findUnique({
        where: { email },
      });

      if (existente) {
        throw new Error('El email ya está registrado');
      }

      // Hash de contraseña
      const hashedPassword = await hashPassword(password);

      // Crear usuario con relaciones según rol
      const usuario = await this.prisma.$transaction(async (tx: TransactionClient) => {
        // 1. Crear usuario base
        const nuevoUsuario = await tx.usuario.create({
          data: {
            email,
            password: hashedPassword,
            nombre,
            telefono,
            rol,
            fotoPerfil,
            activo: true,
          },
        });

        // 2. Si es ARMADOR, crear registro de armador
        if (rol === 'ARMADOR') {
          await tx.armador.create({
            data: {
              usuarioId: nuevoUsuario.id,
              estado: 'ACTIVO',
              habilidades: habilidades || [],
            },
          });
        }

        // 3. Si es SUPERVISOR, asignar proyectos
        if (rol === 'SUPERVISOR' && proyectosIds && proyectosIds.length > 0) {
          await tx.supervisorProyecto.createMany({
            data: proyectosIds.map((proyectoId: string) => ({
              usuarioId: nuevoUsuario.id,
              proyectoId,
            })),
          });
        }

        // Retornar con relaciones
        return tx.usuario.findUnique({
          where: { id: nuevoUsuario.id },
          include: {
            armador: true,
            supervisorProyectos: {
              include: {
                proyecto: {
                  select: { nombreComercial: true },
                },
              },
            },
          },
        });
      });

      return usuario as UsuarioConRelaciones;
    } catch (error) {
      return this.handlePrismaError(error);
    }
  }

  /**
   * Actualizar usuario existente
   */
  async actualizar(
    id: string,
    params: ActualizarUsuarioParams
  ): Promise<UsuarioConRelaciones> {
    try {
      const { nombre, telefono, fotoPerfil, rol, activo, habilidades, proyectosIds } = params;

      // Validar que el usuario existe
      const usuarioExistente = await this.prisma.usuario.findUnique({
        where: { id },
        include: {
          armador: true,
          supervisorProyectos: true,
        },
      });

      if (!usuarioExistente) {
        throw new Error('Usuario no encontrado');
      }

      // Actualizar con transacción
      const usuario = await this.prisma.$transaction(async (tx: TransactionClient) => {
        // 1. Actualizar datos base del usuario
        await tx.usuario.update({
          where: { id },
          data: {
            nombre,
            telefono,
            fotoPerfil,
            rol,
            activo,
          },
        });

        // 2. Si cambia a ROL ARMADOR y no tiene armador
        if (rol === 'ARMADOR' && !usuarioExistente.armador) {
          await tx.armador.create({
            data: {
              usuarioId: id,
              estado: 'ACTIVO',
              habilidades: habilidades || [],
            },
          });
        }

        // 3. Si es ARMADOR y actualiza habilidades
        if (usuarioExistente.armador && habilidades) {
          await tx.armador.update({
            where: { usuarioId: id },
            data: {
              habilidades,
            },
          });
        }

        // 4. Si es SUPERVISOR y actualiza proyectos
        if (rol === 'SUPERVISOR' && proyectosIds) {
          // Eliminar asignaciones anteriores
          await tx.supervisorProyecto.deleteMany({
            where: { usuarioId: id },
          });

          // Crear nuevas asignaciones
          if (proyectosIds.length > 0) {
            await tx.supervisorProyecto.createMany({
              data: proyectosIds.map((proyectoId: string) => ({
                usuarioId: id,
                proyectoId,
              })),
            });
          }
        }

        // Retornar usuario actualizado
        return tx.usuario.findUnique({
          where: { id },
          include: {
            armador: true,
            supervisorProyectos: {
              include: {
                proyecto: {
                  select: { nombreComercial: true },
                },
              },
            },
          },
        });
      });

      return usuario as UsuarioConRelaciones;
    } catch (error) {
      return this.handlePrismaError(error);
    }
  }

  /**
   * Obtener usuario por ID
   */
  async obtenerPorId(id: string): Promise<UsuarioConRelaciones | null> {
    try {
      const usuario = await this.prisma.usuario.findUnique({
        where: { id },
        include: {
          armador: true,
          supervisorProyectos: {
            include: {
              proyecto: {
                select: { id: true, nombreComercial: true },
              },
            },
          },
        },
      });

      return usuario as UsuarioConRelaciones | null;
    } catch (error) {
      return this.handlePrismaError(error);
    }
  }

  /**
   * Obtener usuario por email
   */
  async obtenerPorEmail(email: string): Promise<Usuario | null> {
    try {
      const usuario = await this.prisma.usuario.findUnique({
        where: { email },
      });

      return usuario;
    } catch (error) {
      return this.handlePrismaError(error);
    }
  }

  /**
   * Listar usuarios con filtros
   */
  async listar(params: {
    rol?: RolUsuario;
    activo?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{
    usuarios: UsuarioConRelaciones[];
    total: number;
  }> {
    try {
      const { rol, activo, page = 1, limit = 50 } = params;
      const skip = (page - 1) * limit;

      const where: Prisma.UsuarioWhereInput = {};

      if (rol) where.rol = rol;
      if (activo !== undefined) where.activo = activo;

      const [usuarios, total] = await Promise.all([
        this.prisma.usuario.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            armador: true,
            supervisorProyectos: {
              include: {
                proyecto: {
                  select: { nombreComercial: true },
                },
              },
            },
          },
        }),
        this.prisma.usuario.count({ where }),
      ]);

      return { usuarios: usuarios as UsuarioConRelaciones[], total };
    } catch (error) {
      return this.handlePrismaError(error);
    }
  }

  /**
   * Cambiar estado de loggeo
   */
  async cambiarEstadoLoggeo(
    usuarioId: string,
    nuevoEstado: EstadoLoggeo
  ): Promise<Usuario> {
    try {
      const usuario = await this.prisma.usuario.update({
        where: { id: usuarioId },
        data: { estadoLoggeo: nuevoEstado },
      });

      return usuario;
    } catch (error) {
      return this.handlePrismaError(error);
    }
  }

  /**
   * Activar/Desactivar usuario
   */
  async toggleActivo(id: string): Promise<Usuario> {
    try {
      const usuario = await this.prisma.usuario.findUnique({
        where: { id },
        select: { activo: true },
      });

      if (!usuario) {
        throw new Error('Usuario no encontrado');
      }

      return await this.prisma.usuario.update({
        where: { id },
        data: { activo: !usuario.activo },
      });
    } catch (error) {
      return this.handlePrismaError(error);
    }
  }

  /**
   * Obtener armadores activos
   */
  async obtenerArmadoresActivos(): Promise<any[]> {
    try {
      const armadores = await this.prisma.armador.findMany({
        where: {
          estado: 'ACTIVO',
          usuario: { activo: true },
        },
        include: {
          usuario: {
            select: {
              id: true,
              nombre: true,
              telefono: true,
              estadoLoggeo: true,
              fotoPerfil: true,
            },
          },
          _count: {
            select: {
              ordenes: {
                where: {
                  estado: { in: ['ASIGNADO', 'EN_RUTA', 'ARMADO_INICIADO'] },
                },
              },
            },
          },
        },
      });

      return armadores.map((a: any) => ({
        id: a.id,
        usuarioId: a.usuario.id,
        nombre: a.usuario.nombre,
        telefono: a.usuario.telefono,
        estadoLoggeo: a.usuario.estadoLoggeo,
        fotoPerfil: a.usuario.fotoPerfil,
        habilidades: a.habilidades,
        ordenesActivas: a._count.ordenes,
        ubicacion:
          a.ubicacionActualLat && a.ubicacionActualLng
            ? { lat: a.ubicacionActualLat, lng: a.ubicacionActualLng }
            : null,
      }));
    } catch (error) {
      return this.handlePrismaError(error);
    }
  }
}

// Exportar instancia singleton
export const usuarioService = new UsuarioService();
