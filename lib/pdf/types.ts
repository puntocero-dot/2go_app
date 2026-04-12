import { PDFDocument, PDFPage } from 'pdf-lib';

/**
 * Contexto compartido para renderizar el PDF
 */
export interface PDFContext {
  doc: PDFDocument;
  page: PDFPage;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  font: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fontBold: any;
  y: number;
  margin: number;
  width: number;
  height: number;
}

/**
 * Configuración de colores del PDF
 */
export interface PDFColors {
  primary: ReturnType<typeof import('pdf-lib').rgb>;
  accent: ReturnType<typeof import('pdf-lib').rgb>;
  success: ReturnType<typeof import('pdf-lib').rgb>;
  background: ReturnType<typeof import('pdf-lib').rgb>;
  text: ReturnType<typeof import('pdf-lib').rgb>;
  textLight: ReturnType<typeof import('pdf-lib').rgb>;
  white: ReturnType<typeof import('pdf-lib').rgb>;
  border: ReturnType<typeof import('pdf-lib').rgb>;
}

/**
 * Opciones para generar el PDF
 */
export interface PDFGeneratorOptions {
  showLogo?: boolean;
  showFooter?: boolean;
  showNotes?: boolean;
  colorScheme?: 'default' | 'minimal' | 'corporate';
}
