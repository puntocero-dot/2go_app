import type { PDFContext, PDFColors } from '../types';
import type { BillingDataset } from '@/lib/facturacion-data';
import { sanitizePdfText, formatDateTimeES } from '../utils';

/**
 * Dibuja el pie de página con notas y copyright
 */
export function drawFooter(
  ctx: PDFContext,
  dataset: BillingDataset,
  colors: PDFColors
): void {
  const { page, font, fontBold, margin, width } = ctx;

  // Línea decorativa
  page.drawLine({
    start: { x: margin, y: 60 },
    end: { x: width - margin, y: 60 },
    thickness: 2,
    color: colors.accent,
  });

  // Notas y términos
  page.drawText('NOTAS IMPORTANTES:', {
    x: margin,
    y: 50,
    size: 8,
    font: fontBold,
    color: colors.primary,
  });

  const notes = [
    '- Esta factura es un documento oficial generado por el sistema Armados 2Go.',
    '- Los montos incluyen todos los servicios prestados durante el periodo indicado.',
    '- Para cualquier aclaracion, contactar a facturacion@armados2go.com',
  ];

  let noteY = 38;
  notes.forEach((noteRaw) => {
    const note = sanitizePdfText(noteRaw);
    page.drawText(note, {
      x: margin,
      y: noteY,
      size: 7,
      font: font,
      color: colors.textLight,
    });
    noteY -= 10;
  });

  // Pie de página
  const footerTextRaw = `Armados 2Go - ${new Date().getFullYear()} | www.armados2go.com | Generado el ${formatDateTimeES(new Date())}`;
  const footerText = sanitizePdfText(footerTextRaw);
  const footerWidth = font.widthOfTextAtSize(footerText, 7);

  page.drawText(footerText, {
    x: (width - footerWidth) / 2,
    y: 10,
    size: 7,
    font: font,
    color: colors.textLight,
  });
}
