/**
 * Barrel export para la capa de servicios
 * Importar desde aquí: import { turnoService, ordenService } from '@/lib/services';
 */

export { turnoService, TurnoService } from './turno.service';
export { ordenService, OrdenService } from './orden.service';
export { usuarioService, UsuarioService } from './usuario.service';
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

// Re-exportar tipos de orden
export type {
  FiltrarOrdenesParams,
  OrdenConRelaciones,
} from './orden.service';

// Re-exportar tipos de usuario
export type {
  CrearUsuarioParams,
  ActualizarUsuarioParams,
  UsuarioConRelaciones,
} from './usuario.service';
