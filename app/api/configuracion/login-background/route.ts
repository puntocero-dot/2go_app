import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditFromSession } from "@/lib/audit-logger";
import { getLoginBackgroundUrl, updateLoginBackgroundUrl } from "@/lib/login-background-config";

export async function GET() {
  try {
    const session = await getSession();

    if (!session || session.rol !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const url = await getLoginBackgroundUrl();
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Error cargando configuración de fondo de login:", error);
    return NextResponse.json(
      { error: "Error al cargar configuración" },
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
    const url = typeof body?.url === "string" ? body.url.trim() : "";

    if (!url) {
      return NextResponse.json({ error: "URL de imagen inválida" }, { status: 400 });
    }

    await updateLoginBackgroundUrl(url);

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
      action: "UPDATE_SYSTEM_CONFIG",
      resource: "configuracion",
      resourceId: "LOGIN_BACKGROUND",
      metadata: { url },
      request,
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Error actualizando fondo de login:", error);
    return NextResponse.json(
      { error: "Error al actualizar configuración" },
      { status: 500 }
    );
  }
}
