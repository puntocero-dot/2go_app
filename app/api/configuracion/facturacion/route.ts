import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Obtener configuración de facturación
export async function GET(request: NextRequest) {
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
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || session.rol !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
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
    } = body;

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

    return NextResponse.json(config);
  } catch (error) {
    console.error("Error actualizando configuración:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
