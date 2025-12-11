import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * Clase base para todos los servicios.
 * Proporciona acceso a Prisma y manejo centralizado de errores.
 */
export abstract class BaseService {
  protected prisma = prisma;

  /**
   * Manejo centralizado de errores de Prisma
   */
  protected handlePrismaError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          throw new Error('Ya existe un registro con esos datos únicos');
        case 'P2025':
          throw new Error('Registro no encontrado');
        case 'P2003':
          throw new Error('Violación de restricción de clave foránea');
        case 'P2014':
          throw new Error('La relación requerida no existe');
        default:
          throw new Error(`Error de base de datos: ${error.code}`);
      }
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      throw new Error('Error de validación en la consulta');
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error('Error desconocido en el servicio');
  }

  /**
   * Validar que un registro existe
   */
  protected async validateExists<T>(
    model: { findUnique: (args: { where: { id: string } }) => Promise<T | null> },
    id: string,
    errorMessage = 'Registro no encontrado'
  ): Promise<T> {
    const record = await model.findUnique({ where: { id } });
    if (!record) {
      throw new Error(errorMessage);
    }
    return record;
  }

  /**
   * Ejecutar operación con reintentos
   */
  protected async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    delayMs = 100
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Solo reintentar en errores de conexión
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          ['P1001', 'P1002', 'P1008', 'P1017'].includes(error.code)
        ) {
          if (attempt < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
            continue;
          }
        }

        throw lastError;
      }
    }

    throw lastError || new Error('Operación fallida después de reintentos');
  }
}
