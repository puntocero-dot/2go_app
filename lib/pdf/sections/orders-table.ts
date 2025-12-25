import type { PDFContext, PDFColors } from '../types';
import type { BillingDataset } from '@/lib/facturacion-data';
import { sanitizePdfText, formatMoney } from '../utils';

/**
 * Dibuja la tabla de órdenes con detalle de facturación
 */
export function drawOrdersTable(
  ctx: PDFContext,
  dataset: BillingDataset,
  colors: PDFColors
): void {
  let { page } = ctx;
  const { font, fontBold, margin, width } = ctx;
  let y = ctx.y - 20;

  // Título de la sección
  page.drawRectangle({
    x: margin - 5,
    y: y - 5,
    width: width - 2 * margin + 10,
    height: 20,
    color: colors.primary,
  });

  const tituloDetalle = sanitizePdfText(
    `DETALLE DE FACTURACION - Periodo: ${dataset.periodoLabel}`
  );
  page.drawText(tituloDetalle, {
    x: margin,
    y: y,
    size: 11,
    font: fontBold,
    color: colors.white,
  });

  y -= 25;

  // Headers de la tabla
  const headers = [
    'Orden',
    'Cliente',
    'Armado',
    'Tamano',
    'Prioridad',
    'Distancia',
    'Penaliz.',
    'Total',
  ];
  const columnWidths = [70, 100, 55, 50, 55, 55, 50, 60];
  const columnX: number[] = [];

  let currentX = margin;
  columnWidths.forEach((w) => {
    columnX.push(currentX);
    currentX += w;
  });

  // Header de tabla
  page.drawRectangle({
    x: margin - 2,
    y: y - 2,
    width: width - 2 * margin + 4,
    height: 16,
    color: colors.accent,
  });

  headers.forEach((header, i) => {
    const align = i >= 2 ? 'right' : 'left';
    const x =
      align === 'right'
        ? columnX[i] + columnWidths[i] - 5 - font.widthOfTextAtSize(header, 8)
        : columnX[i];

    page.drawText(header, {
      x,
      y: y + 2,
      size: 8,
      font: fontBold,
      color: colors.white,
    });
  });

  y -= 18;

  // Filas de datos
  let rowIndex = 0;

  for (const orden of dataset.ordenes) {
    // Alternar color de fondo
    if (rowIndex % 2 === 0) {
      page.drawRectangle({
        x: margin - 2,
        y: y - 2,
        width: width - 2 * margin + 4,
        height: 14,
        color: colors.background,
      });
    }

    const rawValues = [
      orden.codigoReferenciaRetail.substring(0, 12),
      orden.clienteNombre.substring(0, 18),
      formatMoney(orden.resumen.armado),
      formatMoney(orden.resumen.tamano),
      formatMoney(orden.resumen.prioridad),
      formatMoney(orden.resumen.distancia),
      formatMoney(orden.resumen.penalizacion),
      formatMoney(orden.total),
    ];

    const values = rawValues.map((v) => sanitizePdfText(v));

    values.forEach((value, i) => {
      const align = i >= 2 ? 'right' : 'left';
      const x =
        align === 'right'
          ? columnX[i] + columnWidths[i] - 5 - font.widthOfTextAtSize(value, 7)
          : columnX[i];

      page.drawText(value, {
        x,
        y,
        size: 7,
        font: font,
        color: colors.text,
      });
    });

    y -= 14;
    rowIndex++;

    // Nueva página si es necesario
    if (y < 150) {
      ctx.page = ctx.doc.addPage();
      page = ctx.page;
      y = ctx.height - ctx.margin;
    }
  }

  ctx.y = y - 10;
  ctx.page = page;
}
