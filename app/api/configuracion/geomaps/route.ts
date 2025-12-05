import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getGeomapsConfig, updateGeomapsConfig } from "@/lib/geomaps-config";

export async function GET() {
  try {
    const session = await getSession();

    if (!session || session.rol !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const config = await getGeomapsConfig();
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

    const parsed = {
      stopDurationMin: Number(body.stopDurationMin),
      stopRadiusMeters: Number(body.stopRadiusMeters),
      speedingKmh: Number(body.speedingKmh),
      clienteRadiusMeters: Number(body.clienteRadiusMeters),
    };

    if (
      !Number.isFinite(parsed.stopDurationMin) ||
      !Number.isFinite(parsed.stopRadiusMeters) ||
      !Number.isFinite(parsed.speedingKmh) ||
      !Number.isFinite(parsed.clienteRadiusMeters) ||
      parsed.stopDurationMin <= 0 ||
      parsed.stopRadiusMeters <= 0 ||
      parsed.speedingKmh <= 0 ||
      parsed.clienteRadiusMeters <= 0
    ) {
      return NextResponse.json(
        { error: "Parámetros inválidos para configuración Geomaps" },
        { status: 400 }
      );
    }

    await updateGeomapsConfig(parsed);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error actualizando configuración Geomaps:", error);
    return NextResponse.json(
      { error: "Error al actualizar configuración Geomaps" },
      { status: 500 }
    );
  }
}
