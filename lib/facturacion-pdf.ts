import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { BillingDataset } from "@/lib/facturacion-data";
import { buildFacturaFromDataset } from "@/lib/facturacion-facturas";

export async function generateBillingPdf(dataset: BillingDataset): Promise<Uint8Array> {
  const factura = buildFacturaFromDataset(dataset);

  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage();
  const width = page.getWidth();
  const height = page.getHeight();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const margin = 50;
  let y = height - margin;

  // Colores corporativos
  const primaryColor = rgb(0.2, 0.4, 0.8); // Azul
  const secondaryColor = rgb(0.5, 0.3, 0.7); // Morado
  const grayColor = rgb(0.4, 0.4, 0.4);
  const lightGray = rgb(0.95, 0.95, 0.95);

  const drawText = (text: string, x: number, yPos: number, size = 10, bold = false, color = rgb(0, 0, 0)) => {
    const usedFont = bold ? fontBold : font;
    page.drawText(text, {
      x,
      y: yPos,
      size,
      font: usedFont,
      color,
    });
  };

  const centerText = (text: string, yPos: number, size = 12, bold = false, color = rgb(0, 0, 0)) => {
    const usedFont = bold ? fontBold : font;
    const textWidth = usedFont.widthOfTextAtSize(text, size);
    const x = (width - textWidth) / 2;
    drawText(text, x, yPos, size, bold, color);
  };

  const drawBox = (x: number, yPos: number, boxWidth: number, boxHeight: number, fillColor: any) => {
    page.drawRectangle({
      x,
      y: yPos,
      width: boxWidth,
      height: boxHeight,
      color: fillColor,
    });
  };

  // Header con fondo de color
  drawBox(0, height - 80, width, 80, primaryColor);
  
  // Logo/Título en header
  drawText("ARMADOS 2GO", margin, height - 35, 20, true, rgb(1, 1, 1));
  drawText("Sistema de Facturación", margin, height - 55, 10, false, rgb(0.9, 0.9, 0.9));

  // Tipo de documento en header
  const tipoDoc = factura.tipoDocumento === "FACTURA_CONSUMIDOR_FINAL"
    ? "FACTURA CONSUMIDOR FINAL"
    : "FACTURA CRÉDITO FISCAL";
  const tipoDocWidth = fontBold.widthOfTextAtSize(tipoDoc, 12);
  drawText(tipoDoc, width - margin - tipoDocWidth, height - 45, 12, true, rgb(1, 1, 1));

  y = height - 100;

  drawText(factura.emisor.nombreComercial, margin, y, 11, true);
  y -= 12;
  drawText(`Giro: ${factura.emisor.giro}`, margin, y, 9);
  y -= 10;
  drawText(
    `Dirección: ${factura.emisor.direccion.municipio ?? ""}, ${
      factura.emisor.direccion.departamento ?? ""
    }`,
    margin,
    y,
    9,
  );
  y -= 10;
  if (factura.emisor.telefono) {
    drawText(`Teléfono: ${factura.emisor.telefono}`, margin, y, 9);
    y -= 10;
  }
  if (factura.emisor.correo) {
    drawText(`Correo: ${factura.emisor.correo}`, margin, y, 9);
    y -= 10;
  }

  y -= 8;

  drawText(`Fecha emisión: ${factura.encabezado.fechaEmision}`, margin, y, 9);
  y -= 10;
  drawText(`Hora emisión: ${factura.encabezado.horaEmision}`, margin, y, 9);
  y -= 10;
  drawText(`Periodo facturado: ${dataset.periodoLabel}`, margin, y, 9);
  y -= 18;

  drawText(
    "Datos del receptor",
    margin,
    y,
    11,
    true,
  );
  y -= 12;

  if (factura.tipoDocumento === "FACTURA_CONSUMIDOR_FINAL") {
    const receptor = factura.receptor;
    drawText(`Nombre: ${receptor.nombre}`, margin, y, 9);
    y -= 10;
    drawText(`DUI: ${receptor.dui}`, margin, y, 9);
    y -= 10;
    if (receptor.direccion) {
      drawText(`Dirección: ${receptor.direccion}`, margin, y, 9);
      y -= 10;
    }
    if (receptor.telefono) {
      drawText(`Teléfono: ${receptor.telefono}`, margin, y, 9);
      y -= 10;
    }
    if (receptor.correo) {
      drawText(`Correo: ${receptor.correo}`, margin, y, 9);
      y -= 10;
    }
  } else {
    const receptor = factura.receptor;
    drawText(`Nombre: ${receptor.nombre}`, margin, y, 9);
    y -= 10;
    drawText(`NIT: ${receptor.nit}`, margin, y, 9);
    y -= 10;
    drawText(`NRC: ${receptor.nrc}`, margin, y, 9);
    y -= 10;
    if (receptor.direccion) {
      drawText(`Dirección: ${receptor.direccion}`, margin, y, 9);
      y -= 10;
    }
    if (receptor.telefono) {
      drawText(`Teléfono: ${receptor.telefono}`, margin, y, 9);
      y -= 10;
    }
    if (receptor.correo) {
      drawText(`Correo: ${receptor.correo}`, margin, y, 9);
      y -= 10;
    }
  }

  y -= 20;

  // Sección de items con header destacado
  drawBox(margin - 5, y - 5, width - 2 * margin + 10, 18, lightGray);
  drawText("DETALLE DE SERVICIOS", margin, y, 11, true, primaryColor);
  y -= 20;

  const headers = [
    "N°",
    "Código",
    "Descripción",
    "Cant.",
    "P. Unitario",
    "Venta Gravada",
  ];
  const columnWidths = [24, 60, 210, 40, 70, 80];
  const columnX: number[] = [];

  let currentX = margin;
  for (const widthCol of columnWidths) {
    columnX.push(currentX);
    currentX += widthCol;
  }

  const formatMoney = (value: number) => `$${value.toFixed(2)}`;
  const lineHeight = 14;

  // Header de tabla con fondo
  drawBox(margin - 2, y - 2, width - 2 * margin + 4, lineHeight + 2, secondaryColor);
  const drawRow = (values: string[], yPos: number, bold = false, color = rgb(0, 0, 0)) => {
    values.forEach((value, index) => {
      drawText(value, columnX[index], yPos, 8, bold, color);
    });
  };

  drawRow(headers, y, true, rgb(1, 1, 1)); // Header con texto blanco
  y -= lineHeight;

  for (const item of factura.cuerpoDocumento) {
    if (y < margin + 80) {
      page = pdfDoc.addPage();
      y = height - margin;
      drawRow(headers, y, true);
      y -= lineHeight;
    }

    const values = [
      String(item.numeroItem),
      item.codigo,
      item.descripcion,
      String(item.cantidad),
      formatMoney(item.precioUnitario),
      formatMoney(item.ventaGravada),
    ];

    drawRow(values, y);
    y -= lineHeight;
  }

  y -= 16;

  drawText("Resumen", margin, y, 11, true);
  y -= 12;

  const resumen = factura.resumen;
  const resumenLabelX = margin;
  const resumenAmountX = margin + 180;

  const drawResumenLine = (label: string, value: number, bold = false) => {
    drawText(label, resumenLabelX, y, 9, bold);
    drawText(formatMoney(value), resumenAmountX, y, 9, bold);
    y -= 10;
  };

  drawResumenLine("Total no sujeto", resumen.totalNoSujeto);
  drawResumenLine("Total exento", resumen.totalExenta);
  drawResumenLine("Total gravado", resumen.totalGravada);
  drawResumenLine("Subtotal", resumen.subTotal);
  drawResumenLine("IVA percibido (13%)", resumen.ivaPercibido);
  drawResumenLine("IVA retenido", resumen.ivaRetenido);
  drawResumenLine("Total descuentos", resumen.totalDescuentos);

  drawResumenLine("Monto total operación", resumen.montoTotalOperacion, true);

  if (y > margin + 20) {
    drawText(`Total en letras: ${resumen.totalLetras}`, margin, y, 8);
    y -= 10;
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
