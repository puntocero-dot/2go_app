import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();

    if (!session || !["ADMIN", "SUPERVISOR"].includes(session.rol)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const armadores = await prisma.armador.findMany({
      where: { estado: "ACTIVO" },
      include: {
        usuario: {
          select: {
            nombre: true,
            telefono: true,
          },
        },
        ordenes: {
          where: {
            estado: {
              in: ["ASIGNADO", "EN_RUTA", "ARMADO_INICIADO"],
            },
          },
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        usuario: {
          nombre: "asc",
        },
      },
    });

    const payload = armadores.map((armador) => ({
      id: armador.id,
      nombre: armador.usuario.nombre,
      telefono: armador.usuario.telefono,
      estado: armador.estado,
      ordenesActivas: armador.ordenes.length,
    }));

    return NextResponse.json({ armadores: payload });
  } catch (error) {
    console.error("Error obteniendo armadores:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
