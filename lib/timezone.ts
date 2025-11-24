/**
 * Utilidades para manejo de zona horaria de El Salvador
 */

export const TIMEZONE = 'America/El_Salvador';

/**
 * Formatea una fecha a la zona horaria de El Salvador
 */
export function formatToSalvadorTime(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Date(d.toLocaleString('en-US', { timeZone: TIMEZONE }));
}

/**
 * Obtiene la fecha actual en El Salvador
 */
export function nowInSalvador(): Date {
  return formatToSalvadorTime(new Date());
}

/**
 * Formatea una fecha para mostrar en El Salvador
 */
export function formatDateSalvador(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('es-SV', {
    timeZone: TIMEZONE,
    ...options
  });
}

/**
 * Formatea solo la hora en El Salvador
 */
export function formatTimeSalvador(date: Date | string): string {
  return formatDateSalvador(date, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Formatea fecha completa en El Salvador
 */
export function formatDateTimeSalvador(date: Date | string): string {
  return formatDateSalvador(date, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}
