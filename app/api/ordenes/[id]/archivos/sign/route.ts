import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCloudinary } from "@/lib/cloudinary";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { tipo, contentType, size } = body as {
      tipo?: string;
      contentType?: string;
      size?: number;
    };

    if (!tipo || (tipo !== "FOTO" && tipo !== "VIDEO")) {
      return NextResponse.json(
        { error: "Tipo de archivo inválido. Usa FOTO o VIDEO." },
        { status: 400 },
      );
    }

    // Validar orden y permisos
    const orden = await prisma.orden.findUnique({
      where: { id },
      select: { armadorId: true },
    });

    if (!orden) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    const esAdminOSupervisor = ["ADMIN", "SUPERVISOR"].includes(session.rol);

    if (session.rol === "ARMADOR") {
      const armador = await prisma.armador.findUnique({
        where: { usuarioId: session.userId },
        select: { id: true },
      });

      if (!armador || orden.armadorId !== armador.id) {
        return NextResponse.json(
          { error: "No tienes permiso para subir evidencias de esta orden" },
          { status: 403 },
        );
      }
    } else if (!esAdminOSupervisor) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Validaciones básicas de tamaño (ejemplo: 25MB)
    if (typeof size === "number" && size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: "El archivo excede el tamaño máximo permitido (25MB)." },
        { status: 400 },
      );
    }

    const { cloudinary, cloudName, apiKey, apiSecret } = getCloudinary();

    const timestamp = Math.round(Date.now() / 1000);
    const folder = `2go/ordenes/${id}`;
    const publicId = `orden-${id}-${timestamp}`;

    const paramsToSign: Record<string, string | number> = {
      timestamp,
      folder,
      public_id: publicId,
    };

    const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

    return NextResponse.json({
      uploadUrl,
      params: {
        api_key: apiKey,
        timestamp,
        folder,
        public_id: publicId,
        signature,
      },
      meta: {
        tipo,
        contentType: contentType ?? null,
      },
    });
  } catch (error) {
    console.error("Error generando firma de Cloudinary:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error interno del servidor al generar la firma de subida.",
      },
      { status: 500 },
    );
  }
}
