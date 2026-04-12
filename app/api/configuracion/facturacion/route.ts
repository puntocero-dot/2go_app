import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withValidation } from "@/lib/api-helpers";
import { ConfiguracionFacturacionSchema } from "@/lib/schemas/configuracion.schemas";
import { logAuditFromSession } from "@/lib/audit-logger";

// GET - Obtener configuración de facturación
export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || session.rol !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Obtener la primera (y única) configuración
    let config = await prisma.configuracionFacturacion.findFirst();

    // Si no existe, crear una con valores por defecto
    if (!config) {
      config = await prisma.configuracionFacturacion.create({
        data: {},
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error("Error obteniendo configuración:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar configuración de facturación
const actualizarConfigHandler = async (
  data: {
    nombreEmpresa?: string;
    giro?: string;
    direccion?: string;
    telefono?: string;
    email?: string;
    logoUrl?: string;
    colorPrimario?: string;
    colorAccent?: string;
    terminosCondiciones?: string;
    notasPiePagina?: string;
  },
  request: NextRequest
) => {
  try {
    const session = await getSession();

    if (!session || session.rol !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const {
      nombreEmpresa,
      giro,
      direccion,
      telefono,
      email,
      logoUrl,
      colorPrimario,
      colorAccent,
      terminosCondiciones,
      notasPiePagina,
    } = data;

    // Obtener la configuración existente o crear una nueva
    let config = await prisma.configuracionFacturacion.findFirst();

    if (!config) {
      config = await prisma.configuracionFacturacion.create({
        data: {
          nombreEmpresa,
          giro,
          direccion,
          telefono,
          email,
          logoUrl,
          colorPrimario,
          colorAccent,
          terminosCondiciones,
          notasPiePagina,
        },
      });
    } else {
      config = await prisma.configuracionFacturacion.update({
        where: { id: config.id },
        data: {
          nombreEmpresa,
          giro,
          direccion,
          telefono,
          email,
          logoUrl,
          colorPrimario,
          colorAccent,
          terminosCondiciones,
          notasPiePagina,
        },
      });
    }

    // Auditar actualización de configuración
    await logAuditFromSession({
      session,
      action: "UPDATE_BILLING_CONFIG",
      resource: "configuracion",
      resourceId: config.id,
      changes: {
        after: data,
      },
      request,
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error("Error actualizando configuración:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
};

// Exportar PUT con validación
export const PUT = withValidation(
  ConfiguracionFacturacionSchema,
  actualizarConfigHandler
);
