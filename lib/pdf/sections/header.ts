import { rgb } from 'pdf-lib';
import type { PDFContext, PDFColors } from '../types';
import type { BillingDataset } from '@/lib/facturacion-data';
import { formatDateES } from '../utils';

/**
 * Dibuja el header del PDF con logo y tipo de documento
 */
export function drawHeader(
  ctx: PDFContext,
  dataset: BillingDataset,
  colors: PDFColors
): void {
  const { page, fontBold, font, width, height, margin } = ctx;

  // Fondo del header
  page.drawRectangle({
    x: 0,
    y: height - 90,
    width: width,
    height: 90,
    color: colors.primary,
  });

  // Línea decorativa superior
  page.drawRectangle({
    x: 0,
    y: height - 5,
    width: width,
    height: 5,
    color: colors.accent,
  });

  // Logo/Título
  page.drawText('ARMADOS 2GO', {
    x: margin,
    y: height - 40,
    size: 24,
    font: fontBold,
    color: colors.white,
  });

  page.drawText('Sistema de Facturacion Profesional', {
    x: margin,
    y: height - 60,
    size: 10,
    font: font,
    color: rgb(0.9, 0.9, 0.9),
  });

  // Tipo de documento en el lado derecho
  const tipoDoc =
    dataset.proyecto.tipoCliente === 'CREDITO_FISCAL'
      ? 'FACTURA CREDITO FISCAL'
      : 'FACTURA CONSUMIDOR FINAL';

  const tipoDocWidth = fontBold.widthOfTextAtSize(tipoDoc, 11);
  page.drawRectangle({
    x: width - margin - tipoDocWidth - 20,
    y: height - 65,
    width: tipoDocWidth + 20,
    height: 30,
    color: colors.accent,
    borderColor: colors.white,
    borderWidth: 2,
  });

  page.drawText(tipoDoc, {
    x: width - margin - tipoDocWidth - 10,
    y: height - 50,
    size: 11,
    font: fontBold,
    color: colors.white,
  });

  // Fecha de emisión
  const today = formatDateES(new Date());
  page.drawText(`Fecha de emision: ${today}`, {
    x: width - margin - 150,
    y: height - 75,
    size: 8,
    font: font,
    color: colors.white,
  });
}
