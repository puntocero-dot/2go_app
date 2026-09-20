/**
 * Barrel export para la capa de servicios
 * Importar desde aquí: import { turnoService } from '@/lib/services';
 */

export { turnoService, TurnoService } from './turno.service';
export { BaseService } from './base.service';

// Re-exportar tipos de turno
export type {
  Coordenadas,
  IniciarTurnoParams,
  GuardarUbicacionParams,
  FinalizarTurnoParams,
  TurnoConRuta,
  EstadisticasTurno,
} from './turno.service';
