import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { calcularCobroOrden } from "@/lib/facturacion-helpers";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { getBillingSecurityHeaders } from "@/lib/security-headers";
import {
  billingFiltersSchema,
  getDateRangeFromFilters,
} from "@/lib/schemas/facturacion.schema";

function escapeCsv(value: string): string {
  const str = value ?? "";
  if (/[",\n]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

export async function GET(request: NextRequest) {
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

    const rate = checkRateLimit(`billing_export:${session.userId}`, {
      windowMs: 5 * 60_000,
      maxRequests: 10,
    });

    if (!rate.ok) {
      return NextResponse.json(
        {
          error:
            "Demasiadas solicitudes de exportación de facturación. Intenta nuevamente más tarde.",
        },
        { status: 429 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const rawFilters = {
      proyectoId: searchParams.get("proyectoId") ?? "",
      desde: searchParams.get("desde") ?? "",
      hasta: searchParams.get("hasta") ?? "",
    };

    const parsed = billingFiltersSchema.safeParse(rawFilters);

    if (!parsed.success) {
      const detalles = parsed.error.flatten();
      return NextResponse.json(
        { error: "Parámetros de filtro inválidos", detalles },
        { status: 400 },
      );
    }

    proyectoId = parsed.data.proyectoId;
    desde = parsed.data.desde;
    hasta = parsed.data.hasta;

    const range = getDateRangeFromFilters(parsed.data);

    const proyecto = await prisma.proyecto.findFirst({
      where: { id: proyectoId, activo: true },
      include: {
        reglaCobro: {
          include: {
            rangosVolumen: true,
            cobrosDistancia: true,
            penalizaciones: true,
          },
        },
      },
    });

    if (!proyecto) {
      return NextResponse.json(
        { error: "Proyecto no encontrado" },
        { status: 404 },
      );
    }

    const ordenes = await prisma.orden.findMany({
      where: {
        proyectoId,
        estado: "ARMADO_COMPLETADO",
        fechaCompletado: {
          gte: range.start,
          lte: range.end,
        },
      },
      orderBy: { fechaCompletado: "asc" },
      include: {
        usuarioFinal: true,
        mueble: true,
        penalizacionesAplicadas: true,
      },
    });

    const headers = [
      "proyecto",
      "ordenCodigo",
      "clienteNombre",
      "clienteMunicipio",
      "fechaArmado",
      "estado",
      "concepto",
      "detalleConcepto",
      "monto",
    ];

    const lines: string[] = [];
    lines.push(headers.join(","));

    let totalFacturado = 0;

    for (const orden of ordenes) {
      const calculo = calcularCobroOrden({
        orden,
        usuarioFinal: orden.usuarioFinal,
        mueble: orden.mueble,
        reglaCobro: proyecto.reglaCobro
          ? {
              ...proyecto.reglaCobro,
              rangosVolumen: proyecto.reglaCobro.rangosVolumen,
              cobrosDistancia: proyecto.reglaCobro.cobrosDistancia,
              penalizaciones: proyecto.reglaCobro.penalizaciones,
            }
          : null,
        penalizacionesAplicadas: orden.penalizacionesAplicadas,
      });

      totalFacturado += calculo.total;

      for (const concepto of calculo.conceptos) {
        const fechaArmado = orden.fechaCompletado
          ? orden.fechaCompletado.toISOString().slice(0, 10)
          : "";

        const row = [
          proyecto.nombreComercial,
          orden.codigoReferenciaRetail,
          orden.usuarioFinal.nombre,
          orden.usuarioFinal.municipio,
          fechaArmado,
          orden.estado,
          concepto.tipo,
          concepto.descripcion,
          concepto.monto.toFixed(2),
        ];

        lines.push(row.map(escapeCsv).join(","));
      }
    }

    const csvContent = "\uFEFF" + lines.join("\n");

    const projectSlug = proyecto.nombreComercial
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const filename = `facturacion_${projectSlug || "proyecto"}_${desde}_a_${hasta}.csv`;

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        accion: "FACTURACION_EXPORT_CSV",
        usuarioId: userId,
        usuarioEmail: userEmail,
        proyectoId,
        desde,
        hasta,
        totalOrdenes: ordenes.length,
        totalFacturado,
        durationMs: Date.now() - startedAt,
        ip:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      }),
    );

    const securityHeaders = getBillingSecurityHeaders();

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        ...securityHeaders,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        tipo: "FACTURACION_EXPORT_CSV_ERROR",
        usuarioId: userId,
        usuarioEmail: userEmail,
        proyectoId,
        desde,
        hasta,
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    return NextResponse.json(
      { error: "Error interno del servidor al generar el CSV de facturación" },
      { status: 500 },
    );
  }
}
