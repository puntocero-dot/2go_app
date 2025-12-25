/**
 * Módulo de generación de PDFs - Versión 2 (Modularizada)
 * 
 * Uso:
 * import { generateBillingPdfV2, generateSimpleBillingPdf } from '@/lib/pdf';
 */

export { generateBillingPdfV2, generateSimpleBillingPdf } from './generator';
export { getColorScheme, DEFAULT_COLORS, MINIMAL_COLORS } from './colors';
export { sanitizePdfText, formatMoney, truncateText, formatDateES, formatDateTimeES } from './utils';
export type { PDFContext, PDFColors, PDFGeneratorOptions } from './types';
