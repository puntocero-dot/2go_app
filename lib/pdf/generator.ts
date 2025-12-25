import { PDFDocument, StandardFonts } from 'pdf-lib';
import type { BillingDataset } from '@/lib/facturacion-data';
import type { PDFContext, PDFGeneratorOptions } from './types';
import { getColorScheme } from './colors';
import {
  drawHeader,
  drawCompanyInfo,
  drawOrdersTable,
  drawSummary,
  drawFooter,
} from './sections';

/**
 * Genera un PDF de facturación con diseño profesional
 * Versión modularizada (V2) del generador de PDFs
 */
export async function generateBillingPdfV2(
  dataset: BillingDataset,
  options: PDFGeneratorOptions = {}
): Promise<Uint8Array> {
  const {
    showLogo = true,
    showFooter = true,
    showNotes = true,
    colorScheme = 'default',
  } = options;

  const colors = getColorScheme(colorScheme);
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const margin = 40;
  let y = height - margin;

  const ctx: PDFContext = {
    doc: pdfDoc,
    page,
    font,
    fontBold,
    y,
    margin,
    width,
    height,
  };

  // Header con diseño profesional
  if (showLogo) {
    drawHeader(ctx, dataset, colors);
    ctx.y -= 100;
  }

  // Información del emisor y receptor en dos columnas
  drawCompanyInfo(ctx, dataset, colors);
  ctx.y -= 30;

  // Tabla de órdenes con columnas separadas
  drawOrdersTable(ctx, dataset, colors);

  // Resumen visual mejorado
  drawSummary(ctx, dataset, colors);

  // Pie de página
  if (showFooter) {
    drawFooter(ctx, dataset, colors);
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

/**
 * Genera un PDF simple (sin header ni footer decorativos)
 */
export async function generateSimpleBillingPdf(
  dataset: BillingDataset
): Promise<Uint8Array> {
  return generateBillingPdfV2(dataset, {
    showLogo: false,
    showFooter: false,
    colorScheme: 'minimal',
  });
}
