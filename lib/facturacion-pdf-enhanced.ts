import { PDFDocument, StandardFonts, rgb, PDFPage } from "pdf-lib";
import type { BillingDataset } from "@/lib/facturacion-data";

// Colores corporativos Armados 2Go
const COLORS = {
  primary: rgb(0.18, 0.31, 0.31), // #2E4F4F - Deep Navy
  accent: rgb(0.93, 0.49, 0.20), // #ED7D32 - Terracota
  success: rgb(0.20, 0.65, 0.33), // #34A853
  background: rgb(0.98, 0.98, 0.98), // #FAFAFA
  text: rgb(0.2, 0.2, 0.2), // #333333
  textLight: rgb(0.5, 0.5, 0.5), // #808080
  white: rgb(1, 1, 1),
  border: rgb(0.85, 0.85, 0.85), // #D9D9D9
};

interface PDFContext {
  doc: PDFDocument;
  page: PDFPage;
  font: any;
  fontBold: any;
  y: number;
  margin: number;
  width: number;
  height: number;
}

export async function generateBillingPdfEnhanced(dataset: BillingDataset): Promise<Uint8Array> {
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
  drawHeader(ctx, dataset);
  ctx.y -= 100;

  // Información del emisor y receptor en dos columnas
  drawCompanyInfo(ctx, dataset);
  ctx.y -= 30;

  // Tabla de órdenes con columnas separadas
  drawOrdersTable(ctx, dataset);

  // Resumen visual mejorado
  drawSummary(ctx, dataset);

  // Pie de página
  drawFooter(ctx, dataset);

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

function drawHeader(ctx: PDFContext, dataset: BillingDataset) {
  const { page, fontBold, font, width, height, margin } = ctx;

  // Fondo del header con gradiente simulado
  page.drawRectangle({
    x: 0,
    y: height - 90,
    width: width,
    height: 90,
    color: COLORS.primary,
  });

  // Línea decorativa superior
  page.drawRectangle({
    x: 0,
    y: height - 5,
    width: width,
    height: 5,
    color: COLORS.accent,
  });

  // Logo/Título
  page.drawText("ARMADOS 2GO", {
    x: margin,
    y: height - 40,
    size: 24,
    font: fontBold,
    color: COLORS.white,
  });

  page.drawText("Sistema de Facturación Profesional", {
    x: margin,
    y: height - 60,
    size: 10,
    font: font,
    color: rgb(0.9, 0.9, 0.9),
  });

  // Tipo de documento en el lado derecho
  const tipoDoc = dataset.proyecto.tipoCliente === "CREDITO_FISCAL"
    ? "FACTURA CRÉDITO FISCAL"
    : "FACTURA CONSUMIDOR FINAL";
  
  const tipoDocWidth = fontBold.widthOfTextAtSize(tipoDoc, 11);
  page.drawRectangle({
    x: width - margin - tipoDocWidth - 20,
    y: height - 65,
    width: tipoDocWidth + 20,
    height: 30,
    color: COLORS.accent,
    borderColor: COLORS.white,
    borderWidth: 2,
  });

  page.drawText(tipoDoc, {
    x: width - margin - tipoDocWidth - 10,
    y: height - 50,
    size: 11,
    font: fontBold,
    color: COLORS.white,
  });

  // Fecha y periodo
  const today = new Date().toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  page.drawText(`Fecha de emisión: ${today}`, {
    x: width - margin - 150,
    y: height - 75,
    size: 8,
    font: font,
    color: COLORS.white,
  });
}

function drawCompanyInfo(ctx: PDFContext, dataset: BillingDataset) {
  const { page, font, fontBold, margin, width } = ctx;
  const startY = ctx.y;

  // Columna izquierda - Emisor (Armados 2Go)
  page.drawRectangle({
    x: margin - 5,
    y: startY - 85,
    width: (width - 2 * margin - 10) / 2,
    height: 85,
    color: COLORS.background,
    borderColor: COLORS.border,
    borderWidth: 1,
  });

  page.drawText("DATOS DEL EMISOR", {
    x: margin,
    y: startY - 15,
    size: 10,
    font: fontBold,
    color: COLORS.primary,
  });

  let y = startY - 30;
  const emisorInfo = [
    `Armados 2Go`,
    `Giro: Servicios de armado de muebles`,
    `Dirección: San Salvador, El Salvador`,
    `Teléfono: +503 0000-0000`,
    `Email: facturacion@armados2go.com`,
  ];

  emisorInfo.forEach((line) => {
    page.drawText(line, {
      x: margin,
      y,
      size: 8,
      font: font,
      color: COLORS.text,
    });
    y -= 12;
  });

  // Columna derecha - Receptor (Cliente)
  const rightX = margin + (width - 2 * margin) / 2 + 5;
  const rightBoxWidth = (width - 2 * margin - 10) / 2;
  page.drawRectangle({
    x: rightX - 5,
    y: startY - 85,
    width: rightBoxWidth,
    height: 85,
    color: COLORS.background,
    borderColor: COLORS.border,
    borderWidth: 1,
  });

  page.drawText("DATOS DEL RECEPTOR", {
    x: rightX,
    y: startY - 15,
    size: 10,
    font: fontBold,
    color: COLORS.primary,
  });

  y = startY - 30;
  const datosFacturacion = dataset.proyecto.datosFacturacion as any;
  
  // Función para truncar texto si es muy largo
  const truncateText = (text: string, maxWidth: number, fontSize: number, font: any) => {
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    if (textWidth <= maxWidth) return text;
    
    let truncated = text;
    while (font.widthOfTextAtSize(truncated + "...", fontSize) > maxWidth && truncated.length > 0) {
      truncated = truncated.slice(0, -1);
    }
    return truncated + "...";
  };
  
  const receptorInfo: string[] = [];
  if (dataset.proyecto.tipoCliente === "CREDITO_FISCAL") {
    const razonSocial = datosFacturacion?.razonSocial || "N/A";
    receptorInfo.push(
      truncateText(`Razón Social: ${razonSocial}`, rightBoxWidth - 15, 8, font),
      `NIT: ${datosFacturacion?.nit || "N/A"}`,
      `NRC: ${datosFacturacion?.nrc || "N/A"}`,
      truncateText(`Giro: ${datosFacturacion?.giro || "N/A"}`, rightBoxWidth - 15, 8, font),
    );
  } else {
    const nombreCompleto = datosFacturacion?.nombreCompleto || dataset.proyecto.nombreComercial;
    receptorInfo.push(
      truncateText(`Nombre: ${nombreCompleto}`, rightBoxWidth - 15, 8, font),
      `DUI: ${datosFacturacion?.dui || "N/A"}`,
    );
  }

  const contactoNombre = datosFacturacion?.contacto?.nombre || "N/A";
  const contactoEmail = datosFacturacion?.contacto?.email || "N/A";
  receptorInfo.push(
    truncateText(`Contacto: ${contactoNombre}`, rightBoxWidth - 15, 8, font),
    truncateText(`Email: ${contactoEmail}`, rightBoxWidth - 15, 7, font),
  );

  receptorInfo.forEach((line) => {
    page.drawText(line, {
      x: rightX,
      y,
      size: 8,
      font: font,
      color: COLORS.text,
    });
    y -= 12;
  });

  ctx.y = startY - 90;
}

function drawOrdersTable(ctx: PDFContext, dataset: BillingDataset) {
  let { page } = ctx;
  const { font, fontBold, margin, width } = ctx;
  let y = ctx.y - 20;

  // Título de la sección
  page.drawRectangle({
    x: margin - 5,
    y: y - 5,
    width: width - 2 * margin + 10,
    height: 20,
    color: COLORS.primary,
  });

  page.drawText(`DETALLE DE FACTURACIÓN - Periodo: ${dataset.periodoLabel}`, {
    x: margin,
    y: y,
    size: 11,
    font: fontBold,
    color: COLORS.white,
  });

  y -= 25;

  // Headers de la tabla
  const headers = ["Orden", "Cliente", "Armado", "Tamaño", "Prioridad", "Distancia", "Penaliz.", "Total"];
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
    color: COLORS.accent,
  });

  headers.forEach((header, i) => {
    const align = i >= 2 ? "right" : "left";
    const x = align === "right" ? columnX[i] + columnWidths[i] - 5 - font.widthOfTextAtSize(header, 8) : columnX[i];
    
    page.drawText(header, {
      x,
      y: y + 2,
      size: 8,
      font: fontBold,
      color: COLORS.white,
    });
  });

  y -= 18;

  // Filas de datos
  const formatMoney = (value: number) => `$${value.toFixed(2)}`;
  let rowIndex = 0;

  for (const orden of dataset.ordenes) {
    // Alternar color de fondo
    if (rowIndex % 2 === 0) {
      page.drawRectangle({
        x: margin - 2,
        y: y - 2,
        width: width - 2 * margin + 4,
        height: 14,
        color: COLORS.background,
      });
    }

    const values = [
      orden.codigoReferenciaRetail.substring(0, 12),
      orden.clienteNombre.substring(0, 18),
      formatMoney(orden.resumen.armado),
      formatMoney(orden.resumen.tamano),
      formatMoney(orden.resumen.prioridad),
      formatMoney(orden.resumen.distancia),
      formatMoney(orden.resumen.penalizacion),
      formatMoney(orden.total),
    ];

    values.forEach((value, i) => {
      const align = i >= 2 ? "right" : "left";
      const x = align === "right" 
        ? columnX[i] + columnWidths[i] - 5 - font.widthOfTextAtSize(value, 7)
        : columnX[i];
      
      page.drawText(value, {
        x,
        y,
        size: 7,
        font: font,
        color: COLORS.text,
      });
    });

    y -= 14;
    rowIndex++;

    // Nueva página si es necesario
    if (y < 150) {
      ctx.page = ctx.doc.addPage();
      page = ctx.page;
      y = ctx.height - margin;
    }
  }

  ctx.y = y - 10;
  ctx.page = page;
}

function drawSummary(ctx: PDFContext, dataset: BillingDataset) {
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
    color: COLORS.background,
    borderColor: COLORS.primary,
    borderWidth: 2,
  });

  // Título del resumen
  page.drawRectangle({
    x: boxX - 10,
    y: y - 20,
    width: boxWidth + 10,
    height: 20,
    color: COLORS.primary,
  });

  page.drawText("RESUMEN DE FACTURACIÓN", {
    x: boxX,
    y: y - 15,
    size: 10,
    font: fontBold,
    color: COLORS.white,
  });

  y -= 35;

  // Líneas del resumen
  const summaryItems = [
    { label: "Costo de Armado:", value: summary.armado },
    { label: "Costo por Tamaño:", value: summary.tamano },
    { label: "Costo por Prioridad:", value: summary.prioridad },
    { label: "Costo por Distancia:", value: summary.distancia },
    { label: "Penalizaciones:", value: summary.penalizacion },
  ];

  summaryItems.forEach((item) => {
    page.drawText(item.label, {
      x: boxX,
      y,
      size: 9,
      font: font,
      color: COLORS.text,
    });

    page.drawText(`$${item.value.toFixed(2)}`, {
      x: boxX + boxWidth - 60,
      y,
      size: 9,
      font: font,
      color: COLORS.text,
    });

    y -= 14;
  });

  // Línea separadora
  page.drawLine({
    start: { x: boxX, y: y + 5 },
    end: { x: boxX + boxWidth - 10, y: y + 5 },
    thickness: 1,
    color: COLORS.border,
  });

  y -= 10;

  // Total destacado
  page.drawRectangle({
    x: boxX - 5,
    y: y - 5,
    width: boxWidth,
    height: 18,
    color: COLORS.success,
  });

  page.drawText("TOTAL A FACTURAR:", {
    x: boxX,
    y: y,
    size: 11,
    font: fontBold,
    color: COLORS.white,
  });

  page.drawText(`$${summary.totalFacturado.toFixed(2)}`, {
    x: boxX + boxWidth - 80,
    y,
    size: 11,
    font: fontBold,
    color: COLORS.white,
  });

  // Información adicional a la izquierda
  const leftY = ctx.y - 40;
  page.drawText(`Total de órdenes: ${dataset.ordenes.length}`, {
    x: margin,
    y: leftY,
    size: 9,
    font: font,
    color: COLORS.textLight,
  });

  page.drawText(`Proyecto: ${dataset.proyecto.nombreComercial}`, {
    x: margin,
    y: leftY - 15,
    size: 9,
    font: font,
    color: COLORS.textLight,
  });

  ctx.y = y - 30;
}

function drawFooter(ctx: PDFContext, dataset: BillingDataset) {
  const { page, font, fontBold, margin, width, height } = ctx;

  // Línea decorativa
  page.drawLine({
    start: { x: margin, y: 60 },
    end: { x: width - margin, y: 60 },
    thickness: 2,
    color: COLORS.accent,
  });

  // Notas y términos
  page.drawText("NOTAS IMPORTANTES:", {
    x: margin,
    y: 50,
    size: 8,
    font: fontBold,
    color: COLORS.primary,
  });

  const notes = [
    "• Esta factura es un documento oficial generado por el sistema Armados 2Go.",
    "• Los montos incluyen todos los servicios prestados durante el periodo indicado.",
    "• Para cualquier aclaración, contactar a facturacion@armados2go.com",
  ];

  let noteY = 38;
  notes.forEach((note) => {
    page.drawText(note, {
      x: margin,
      y: noteY,
      size: 7,
      font: font,
      color: COLORS.textLight,
    });
    noteY -= 10;
  });

  // Pie de página
  const footerText = `Armados 2Go © ${new Date().getFullYear()} | www.armados2go.com | Generado el ${new Date().toLocaleString("es-ES")}`;
  const footerWidth = font.widthOfTextAtSize(footerText, 7);
  
  page.drawText(footerText, {
    x: (width - footerWidth) / 2,
    y: 10,
    size: 7,
    font: font,
    color: COLORS.textLight,
  });
}
