import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { withRateLimit } from "@/lib/api-helpers";
import { RATE_LIMITS } from "@/lib/rate-limit";

// Schema para validar el parámetro de búsqueda
const BuscarOrdenPorCodigoSchema = z.object({
  codigo: z
    .string()
    .min(1, "Parámetro 'codigo' es requerido")
    .max(100, "Código demasiado largo")
    .transform((v) => v.trim()),
});

// Handler principal
const handler = async (request: NextRequest): Promise<Response> => {
  const { searchParams } = new URL(request.url);
  const rawCodigo = searchParams.get("codigo") ?? "";

  const parsed = BuscarOrdenPorCodigoSchema.safeParse({ codigo: rawCodigo });

  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    return NextResponse.json(
      { error: firstError?.message ?? "Parámetro 'codigo' es requerido" },
      { status: 400 },
    );
  }

  const { codigo } = parsed.data;

  try {
    const orden = await prisma.orden.findFirst({
      where: { codigoReferenciaRetail: codigo },
      select: {
        id: true,
        codigoReferenciaRetail: true,
        estado: true,
      },
    });

    if (!orden) {
      return NextResponse.json(
        { error: "No se encontró una orden con ese código" },
        { status: 404 },
      );
    }

    return NextResponse.json({ orden });
  } catch (error) {
    console.error("Error buscando orden por código:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
};

// GET - Buscar orden pública por código de referencia (codigoReferenciaRetail)
// No requiere sesión. Devuelve solo los datos mínimos necesarios para redirigir
// al detalle público de seguimiento. Protegido con rate limiting por IP.
export const GET = withRateLimit(
  handler,
  {
    // Límite suave: 30 búsquedas por minuto por IP
    ...RATE_LIMITS.DEFAULT,
    maxRequests: 30,
  },
  (request) => {
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
    return `ordenes-por-codigo:${ip}`;
  },
);
