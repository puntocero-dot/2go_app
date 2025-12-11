import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ConfiguracionGeomapsSchema } from "@/lib/schemas/geomaps.schemas";
import { logAuditFromSession } from "@/lib/audit-logger";

export async function GET() {
  try {
    const session = await getSession();

    if (!session || session.rol !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Obtener la configuración (o crear una por defecto si no existe)
    let config = await prisma.configuracionGeomaps.findFirst();

    if (!config) {
      // Crear configuración por defecto
      config = await prisma.configuracionGeomaps.create({
        data: {
          duracionMinimaParada: 5,
          radioParada: 50,
          umbralVelocidadExcesiva: 80,
          radioProximidadCliente: 100,
          intervaloActualizacionGPS: 2,
        },
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error("Error cargando configuración Geomaps:", error);
    return NextResponse.json(
      { error: "Error al cargar configuración Geomaps" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || session.rol !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();

    // Validar con Zod
    const validacion = ConfiguracionGeomapsSchema.safeParse(body);

    if (!validacion.success) {
      return NextResponse.json(
        { error: "Datos inválidos", detalles: validacion.error.errors },
        { status: 400 }
      );
    }

    const data = validacion.data;

    // Buscar configuración existente
    const configExistente = await prisma.configuracionGeomaps.findFirst();

    let config;
    if (configExistente) {
      // Actualizar
      config = await prisma.configuracionGeomaps.update({
        where: { id: configExistente.id },
        data,
      });
    } else {
      // Crear
      config = await prisma.configuracionGeomaps.create({
        data,
      });
    }

    // Auditoría
    const usuario = await prisma.usuario.findUnique({
      where: { id: session.userId },
      select: { nombre: true },
    });

    await logAuditFromSession({
      session: {
        userId: session.userId,
        nombre: usuario?.nombre || "Admin",
        rol: session.rol,
      },
      action: "UPDATE_GEOMAPS_CONFIG",
      resource: "configuracion",
      resourceId: config.id,
      metadata: { config: data },
      request,
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error("Error actualizando configuración Geomaps:", error);
    return NextResponse.json(
      { error: "Error al actualizar configuración Geomaps" },
      { status: 500 }
    );
  }
}
