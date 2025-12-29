import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || session.rol !== "ARMADOR") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const inicio = searchParams.get("inicio");
    const fin = searchParams.get("fin");

    if (!inicio || !fin) {
      return NextResponse.json(
        { error: "Se requieren fechas de inicio y fin" },
        { status: 400 }
      );
    }

    // Buscar el armador del usuario
    const armador = await prisma.armador.findUnique({
      where: { usuarioId: session.userId },
    });

    if (!armador) {
      return NextResponse.json(
        { error: "No se encontró perfil de armador" },
        { status: 404 }
      );
    }

    const fechaInicio = new Date(`${inicio}T00:00:00`);
    const fechaFin = new Date(`${fin}T23:59:59`);

    // Obtener órdenes asignadas al armador en el rango de fechas
    const ordenes = await prisma.orden.findMany({
      where: {
        armadorId: armador.id,
        OR: [
          {
            fechaSolicitadaCliente: {
              gte: fechaInicio,
              lte: fechaFin,
            },
          },
          {
            fechaCreacion: {
              gte: fechaInicio,
              lte: fechaFin,
            },
            fechaSolicitadaCliente: null,
          },
        ],
      },
      include: {
        proyecto: { select: { nombreComercial: true } },
        usuarioFinal: {
          select: {
            nombre: true,
            direccionCompleta: true,
            municipio: true,
          },
        },
      },
      orderBy: [
        { fechaSolicitadaCliente: "asc" },
        { fechaCreacion: "asc" },
      ],
    });

    // Formatear órdenes para el calendario
    const ordenesFormatted = ordenes.map((o) => ({
      id: o.id,
      codigoReferenciaRetail: o.codigoReferenciaRetail,
      estado: o.estado,
      proyecto: o.proyecto?.nombreComercial || "Sin proyecto",
      cliente: o.usuarioFinal?.nombre || "Sin cliente",
      direccion: o.usuarioFinal?.direccionCompleta || "",
      municipio: o.usuarioFinal?.municipio || "",
      fechaSolicitada: (o.fechaSolicitadaCliente || o.fechaCreacion).toISOString(),
      prioridad: o.prioridad,
    }));

    return NextResponse.json({ ordenes: ordenesFormatted });
  } catch (error) {
    console.error("Error en calendario de armador:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
