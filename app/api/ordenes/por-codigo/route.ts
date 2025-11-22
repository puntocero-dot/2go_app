import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Buscar orden pública por código de referencia (codigoReferenciaRetail)
// No requiere sesión. Devuelve solo los datos mínimos necesarios para redirigir
// al detalle público de seguimiento.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const codigo = (searchParams.get("codigo") || "").trim();

  if (!codigo) {
    return NextResponse.json(
      { error: "Parámetro 'codigo' es requerido" },
      { status: 400 },
    );
  }

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
}
