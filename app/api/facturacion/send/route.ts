import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBillingDataset } from "@/lib/facturacion-data";
import type { BillingDataset } from "@/lib/facturacion-data";
import { generateBillingPdf } from "@/lib/facturacion-pdf";
import { generateBillingEmailHTML } from "@/lib/email-templates";
import { checkRateLimit } from "@/lib/rate-limit";
import { getBillingSecurityHeaders } from "@/lib/security-headers";
import { billingFiltersSchema } from "@/lib/schemas/facturacion.schema";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type DatosFacturacion = {
  contacto?: {
    nombre?: string;
    email?: string;
    telefono?: string;
  };
  razonSocial?: string;
  nombreCompleto?: string;
  direccion?: string;
};

function slugifyProjectName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeCsv(value: string): string {
  const str = value ?? "";
  if (/[",\n]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function buildCsvFromDataset(dataset: BillingDataset): string {
  const headers = [
    "proyecto",
    "ordenCodigo",
    "clienteNombre",
    "clienteMunicipio",
    "fechaArmado",
    "estado",
    "armado",
    "tamano",
    "distancia",
    "penalizacion",
    "prioridad",
    "total",
  ];

  const lines: string[] = [];
  lines.push(headers.join(","));

  for (const orden of dataset.ordenes) {
    const fechaArmado = orden.fechaCompletado
      ? orden.fechaCompletado.toISOString().slice(0, 10)
      : "";

    const row = [
      dataset.proyecto.nombreComercial,
      orden.codigoReferenciaRetail,
      orden.clienteNombre,
      orden.municipio,
      fechaArmado,
      orden.estado,
      orden.resumen.armado.toFixed(2),
      orden.resumen.tamano.toFixed(2),
      orden.resumen.distancia.toFixed(2),
      orden.resumen.penalizacion.toFixed(2),
      orden.resumen.prioridad.toFixed(2),
      orden.total.toFixed(2),
    ];

    lines.push(row.map(escapeCsv).join(","));
  }

  return "\uFEFF" + lines.join("\n");
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  let proyectoId = "";
  let desde = "";
  let hasta = "";
  let userId: string | null = null;
  let userEmail: string | null = null;

  try {
    const session = await getSession();

    if (!session || session.rol !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    userId = session.userId;
    userEmail = session.email;

    const rate = await checkRateLimit(`billing_send:${session.userId}`, {
      windowMs: 15 * 60_000,
      maxRequests: 5,
    });

    if (!rate.ok) {
      return NextResponse.json(
        {
          error:
            "Demasiadas solicitudes de envío de facturación por correo. Intenta nuevamente más tarde.",
        },
        { status: 429 },
      );
    }

    const rawBody = (await request.json().catch(() => null)) as unknown;

    const parsed = billingFiltersSchema.safeParse(rawBody ?? {});

    if (!parsed.success) {
      const detalles = parsed.error.flatten();
      return NextResponse.json(
        { error: "Parámetros de filtro inválidos", detalles },
        { status: 400 },
      );
    }

    proyectoId = parsed.data.proyectoId;
    desde = parsed.data.desde || '';
    hasta = parsed.data.hasta || '';

    const dataset = await getBillingDataset({ proyectoId, desde, hasta });

    if (!dataset || dataset.ordenes.length === 0) {
      return NextResponse.json(
        { error: "No hay órdenes facturables para este proyecto en el periodo seleccionado" },
        { status: 400 },
      );
    }

    const datos = (dataset.proyecto.datosFacturacion ?? {}) as DatosFacturacion;
    
    // Buscar email en datosFacturacion.contacto.email
    let toEmail = datos.contacto?.email;
    
    // Si no hay email en el dataset, buscar el proyecto directamente
    if (!toEmail && proyectoId !== "ALL") {
      const proyectoDirecto = await prisma.proyecto.findUnique({
        where: { id: proyectoId },
        select: { datosFacturacion: true },
      });
      
      if (proyectoDirecto?.datosFacturacion) {
        const datosDirecto = proyectoDirecto.datosFacturacion as DatosFacturacion;
        toEmail = datosDirecto.contacto?.email;
      }
    }

    if (!toEmail) {
      return NextResponse.json(
        { error: "El proyecto no tiene configurado un correo de contacto de facturación" },
        { status: 400 },
      );
    }

    const projectSlug = slugifyProjectName(dataset.proyecto.nombreComercial);
    const baseFilename = `facturacion_${projectSlug || "proyecto"}_${desde}_a_${hasta}`;

    const pdfBytes = await generateBillingPdf(dataset);
    const csvContent = buildCsvFromDataset(dataset);
    
    // Generar JSON con datos de facturación
    const jsonContent = JSON.stringify({
      proyecto: {
        id: dataset.proyecto.id,
        nombre: dataset.proyecto.nombreComercial,
      },
      periodo: {
        desde,
        hasta,
        label: dataset.periodoLabel,
      },
      resumen: {
        totalOrdenes: dataset.ordenes.length,
        totalFacturado: dataset.totalsByConcept.totalFacturado,
        desglose: dataset.totalsByConcept,
      },
      ordenes: dataset.ordenes.map(orden => ({
        codigo: orden.codigoReferenciaRetail,
        cliente: orden.clienteNombre,
        municipio: orden.municipio,
        proyecto: orden.proyectoNombre,
        fechaCompletado: orden.fechaCompletado?.toISOString() || null,
        estado: orden.estado,
        conceptos: orden.conceptos,
        resumen: orden.resumen,
        total: orden.total,
      })),
      generadoEn: new Date().toISOString(),
    }, null, 2);

    const pdfBase64 = Buffer.from(pdfBytes).toString("base64");
    const csvBase64 = Buffer.from(csvContent, "utf8").toString("base64");
    const jsonBase64 = Buffer.from(jsonContent, "utf8").toString("base64");

    await resend.emails.send({
      from: process.env.EMAIL_FROM || "noreply@armados2go.com",
      to: toEmail,
      subject: `📊 Facturación ${dataset.proyecto.nombreComercial} - ${dataset.periodoLabel}`,
      html: generateBillingEmailHTML(dataset, datos),
      attachments: [
        {
          filename: `${baseFilename}.pdf`,
          content: pdfBase64,
          contentType: "application/pdf",
        },
        {
          filename: `${baseFilename}.csv`,
          content: csvBase64,
          contentType: "text/csv",
        },
        {
          filename: `${baseFilename}.json`,
          content: jsonBase64,
          contentType: "application/json",
        },
      ],
    });

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        accion: "FACTURACION_SEND_EMAIL",
        usuarioId: userId,
        usuarioEmail: userEmail,
        proyectoId,
        desde,
        hasta,
        destinatario: toEmail,
        totalOrdenes: dataset.ordenes.length,
        totalFacturado: dataset.totalsByConcept.totalFacturado,
        durationMs: Date.now() - startedAt,
        ip:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      }),
    );

    const securityHeaders = getBillingSecurityHeaders();

    return NextResponse.json(
      {
        ok: true,
        message: "Facturación enviada al correo de contacto del proyecto.",
      },
      {
        status: 200,
        headers: securityHeaders,
      },
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        tipo: "FACTURACION_SEND_EMAIL_ERROR",
        usuarioId: userId,
        usuarioEmail: userEmail,
        proyectoId,
        desde,
        hasta,
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    const securityHeaders = getBillingSecurityHeaders();

    return NextResponse.json(
      { error: "Error interno del servidor al enviar la facturación por correo" },
      { status: 500, headers: securityHeaders },
    );
  }
}
