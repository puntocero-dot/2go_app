import type { PDFContext, PDFColors } from '../types';
import type { BillingDataset } from '@/lib/facturacion-data';
import { sanitizePdfText, truncateText } from '../utils';

/**
 * Dibuja la información del emisor y receptor en dos columnas
 */
export function drawCompanyInfo(
  ctx: PDFContext,
  dataset: BillingDataset,
  colors: PDFColors
): void {
  const { page, font, fontBold, margin, width } = ctx;
  const startY = ctx.y;

  // Columna izquierda - Emisor (Armados 2Go)
  const leftBoxWidth = (width - 2 * margin - 10) / 2;
  page.drawRectangle({
    x: margin - 5,
    y: startY - 85,
    width: leftBoxWidth,
    height: 85,
    color: colors.background,
    borderColor: colors.border,
    borderWidth: 1,
  });

  page.drawText('DATOS DEL EMISOR', {
    x: margin,
    y: startY - 15,
    size: 10,
    font: fontBold,
    color: colors.primary,
  });

  let y = startY - 30;
  const emisorInfo = [
    'Armados 2Go',
    'Giro: Servicios de armado de muebles',
    'Direccion: San Salvador, El Salvador',
    'Telefono: +503 0000-0000',
    'Email: facturacion@armados2go.com',
  ];

  emisorInfo.forEach((lineRaw) => {
    const line = sanitizePdfText(lineRaw);
    page.drawText(line, {
      x: margin,
      y,
      size: 8,
      font: font,
      color: colors.text,
    });
    y -= 12;
  });

  // Columna derecha - Receptor (Cliente)
  const rightX = margin + leftBoxWidth + 10;
  const rightBoxWidth = leftBoxWidth;
  
  page.drawRectangle({
    x: rightX - 5,
    y: startY - 85,
    width: rightBoxWidth,
    height: 85,
    color: colors.background,
    borderColor: colors.border,
    borderWidth: 1,
  });

  page.drawText('DATOS DEL RECEPTOR', {
    x: rightX,
    y: startY - 15,
    size: 10,
    font: fontBold,
    color: colors.primary,
  });

  y = startY - 30;
  const datosFacturacion = dataset.proyecto.datosFacturacion as any;

  const receptorInfo: string[] = [];
  if (dataset.proyecto.tipoCliente === 'CREDITO_FISCAL') {
    const razonSocial = datosFacturacion?.razonSocial || 'N/A';
    receptorInfo.push(
      truncateText(`Razon Social: ${razonSocial}`, rightBoxWidth - 15, 8, font),
      sanitizePdfText(`NIT: ${datosFacturacion?.nit || 'N/A'}`),
      sanitizePdfText(`NRC: ${datosFacturacion?.nrc || 'N/A'}`),
      truncateText(`Giro: ${datosFacturacion?.giro || 'N/A'}`, rightBoxWidth - 15, 8, font)
    );
  } else {
    const nombreCompleto =
      datosFacturacion?.nombreCompleto || dataset.proyecto.nombreComercial;
    receptorInfo.push(
      truncateText(`Nombre: ${nombreCompleto}`, rightBoxWidth - 15, 8, font),
      sanitizePdfText(`DUI: ${datosFacturacion?.dui || 'N/A'}`)
    );
  }

  const contactoNombre = datosFacturacion?.contacto?.nombre || 'N/A';
  const contactoEmail = datosFacturacion?.contacto?.email || 'N/A';
  receptorInfo.push(
    truncateText(`Contacto: ${contactoNombre}`, rightBoxWidth - 15, 8, font),
    truncateText(`Email: ${contactoEmail}`, rightBoxWidth - 15, 7, font)
  );

  receptorInfo.forEach((lineRaw) => {
    const line = sanitizePdfText(lineRaw);
    page.drawText(line, {
      x: rightX,
      y,
      size: 8,
      font: font,
      color: colors.text,
    });
    y -= 12;
  });

  ctx.y = startY - 90;
}
