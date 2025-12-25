import type { PDFContext, PDFColors } from '../types';
import type { BillingDataset } from '@/lib/facturacion-data';
import { sanitizePdfText } from '../utils';

/**
 * Dibuja el resumen de facturación con totales por concepto
 */
export function drawSummary(
  ctx: PDFContext,
  dataset: BillingDataset,
  colors: PDFColors
): void {
  const { page, font, fontBold, margin, width } = ctx;
  let y = ctx.y - 20;

  const summary = dataset.totalsByConcept;

  // Caja de resumen con diseño mejorado
  const boxWidth = 280;
  const boxX = width - margin - boxWidth;

  page.drawRectangle({
    x: boxX - 10,
    y: y - 120,
    width: boxWidth + 10,
    height: 120,
    color: colors.background,
    borderColor: colors.primary,
    borderWidth: 2,
  });

  // Título del resumen
  page.drawRectangle({
    x: boxX - 10,
    y: y - 20,
    width: boxWidth + 10,
    height: 20,
    color: colors.primary,
  });

  page.drawText('RESUMEN DE FACTURACION', {
    x: boxX,
    y: y - 15,
    size: 10,
    font: fontBold,
    color: colors.white,
  });

  y -= 35;

  // Líneas del resumen
  const summaryItems = [
    { label: 'Costo de Armado:', value: summary.armado },
    { label: 'Costo por Tamano:', value: summary.tamano },
    { label: 'Costo por Prioridad:', value: summary.prioridad },
    { label: 'Costo por Distancia:', value: summary.distancia },
    { label: 'Penalizaciones:', value: summary.penalizacion },
  ];

  summaryItems.forEach((item) => {
    page.drawText(item.label, {
      x: boxX,
      y,
      size: 9,
      font: font,
      color: colors.text,
    });

    page.drawText(`$${item.value.toFixed(2)}`, {
      x: boxX + boxWidth - 60,
      y,
      size: 9,
      font: font,
      color: colors.text,
    });

    y -= 14;
  });

  // Línea separadora
  page.drawLine({
    start: { x: boxX, y: y + 5 },
    end: { x: boxX + boxWidth - 10, y: y + 5 },
    thickness: 1,
    color: colors.border,
  });

  y -= 10;

  // Total destacado
  page.drawRectangle({
    x: boxX - 5,
    y: y - 5,
    width: boxWidth,
    height: 18,
    color: colors.success,
  });

  page.drawText('TOTAL A FACTURAR:', {
    x: boxX,
    y: y,
    size: 11,
    font: fontBold,
    color: colors.white,
  });

  page.drawText(`$${summary.totalFacturado.toFixed(2)}`, {
    x: boxX + boxWidth - 80,
    y,
    size: 11,
    font: fontBold,
    color: colors.white,
  });

  // Información adicional a la izquierda
  const leftY = ctx.y - 40;
  page.drawText(sanitizePdfText(`Total de ordenes: ${dataset.ordenes.length}`), {
    x: margin,
    y: leftY,
    size: 9,
    font: font,
    color: colors.textLight,
  });

  page.drawText(sanitizePdfText(`Proyecto: ${dataset.proyecto.nombreComercial}`), {
    x: margin,
    y: leftY - 15,
    size: 9,
    font: font,
    color: colors.textLight,
  });

  ctx.y = y - 30;
}
