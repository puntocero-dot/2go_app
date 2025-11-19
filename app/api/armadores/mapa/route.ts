import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Obtener ubicaciones de todos los armadores activos
export async function GET() {
  try {
    const session = await getSession();

    if (!session || !["ADMIN", "SUPERVISOR"].includes(session.rol)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const armadores = await prisma.armador.findMany({
      where: {
        estado: "ACTIVO",
        ubicacionActualLat: { not: null },
        ubicacionActualLng: { not: null },
      },
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
          include: {
            usuarioFinal: {
              select: {
                nombre: true,
                direccionCompleta: true,
                municipio: true,
              },
            },
          },
        },
      },
    });

    const armadoresConUbicacion = armadores.map((armador) => ({
      id: armador.id,
      nombre: armador.usuario.nombre,
      telefono: armador.usuario.telefono,
      estado: armador.estado,
      lat: armador.ubicacionActualLat,
      lng: armador.ubicacionActualLng,
      ultimaActualizacion: armador.ultimaActualizacionGPS,
      ordenesActivas: armador.ordenes.length,
      ordenes: armador.ordenes.map((orden) => ({
        id: orden.id,
        codigo: orden.codigoReferenciaRetail,
        cliente: orden.usuarioFinal.nombre,
        direccion: orden.usuarioFinal.direccionCompleta,
        municipio: orden.usuarioFinal.municipio,
        estado: orden.estado,
      })),
    }));

    return NextResponse.json({ armadores: armadoresConUbicacion });
  } catch (error) {
    console.error("Error obteniendo ubicaciones:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}