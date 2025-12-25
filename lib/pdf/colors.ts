import { rgb } from 'pdf-lib';
import type { PDFColors } from './types';

/**
 * Colores corporativos Armados 2Go
 */
export const DEFAULT_COLORS: PDFColors = {
  primary: rgb(0.18, 0.31, 0.31),    // #2E4F4F - Deep Navy
  accent: rgb(0.93, 0.49, 0.20),     // #ED7D32 - Terracota
  success: rgb(0.20, 0.65, 0.33),    // #34A853
  background: rgb(0.98, 0.98, 0.98), // #FAFAFA
  text: rgb(0.2, 0.2, 0.2),          // #333333
  textLight: rgb(0.5, 0.5, 0.5),     // #808080
  white: rgb(1, 1, 1),
  border: rgb(0.85, 0.85, 0.85),     // #D9D9D9
};

/**
 * Esquema de colores minimalista
 */
export const MINIMAL_COLORS: PDFColors = {
  primary: rgb(0.2, 0.2, 0.2),
  accent: rgb(0.4, 0.4, 0.4),
  success: rgb(0.3, 0.3, 0.3),
  background: rgb(0.98, 0.98, 0.98),
  text: rgb(0.1, 0.1, 0.1),
  textLight: rgb(0.5, 0.5, 0.5),
  white: rgb(1, 1, 1),
  border: rgb(0.8, 0.8, 0.8),
};

/**
 * Obtener esquema de colores por nombre
 */
export function getColorScheme(scheme: 'default' | 'minimal' | 'corporate' = 'default'): PDFColors {
  switch (scheme) {
    case 'minimal':
      return MINIMAL_COLORS;
    case 'corporate':
    case 'default':
    default:
      return DEFAULT_COLORS;
  }
}
