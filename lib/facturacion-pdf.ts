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

  const margin = 40;
  let y = height - margin;

  const drawText = (text: string, x: number, yPos: number, size = 10, bold = false) => {
    const usedFont = bold ? fontBold : font;
    page.drawText(text, {
      x,
      y: yPos,
      size,
      font: usedFont,
      color: rgb(0, 0, 0),
    });
  };

  const centerText = (text: string, yPos: number, size = 12, bold = false) => {
    const usedFont = bold ? fontBold : font;
    const textWidth = usedFont.widthOfTextAtSize(text, size);
    const x = (width - textWidth) / 2;
    drawText(text, x, yPos, size, bold);
  };

  centerText(
    factura.tipoDocumento === "FACTURA_CONSUMIDOR_FINAL"
      ? "FACTURA CONSUMIDOR FINAL"
      : "FACTURA CRÉDITO FISCAL",
    y,
    14,
    true,
  );
  y -= 18;

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

  y -= 16;

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
  const lineHeight = 12;

  const drawRow = (values: string[], yPos: number, bold = false) => {
    values.forEach((value, index) => {
      drawText(value, columnX[index], yPos, 8, bold);
    });
  };

  drawText("Detalle de servicios", margin, y, 11, true);
  y -= 14;
  drawRow(headers, y, true);
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
