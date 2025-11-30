import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { TipoArchivo } from "@prisma/client";
import { withValidation } from "@/lib/api-helpers";
import {
  RegistrarArchivosOrdenSchema,
  RegistrarArchivosOrdenInput,
} from "@/lib/schemas/orden.schemas";

type RouteContext = { params: Promise<{ id: string }> };

const registrarArchivosHandler = async (
  data: RegistrarArchivosOrdenInput,
  request: NextRequest,
  context: RouteContext
) => {
  const { id } = await context.params;

  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const archivos = data.archivos as { url: string; tipo: TipoArchivo }[];

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
          { error: "No tienes permiso para registrar evidencias de esta orden" },
          { status: 403 },
        );
      }
    } else if (!esAdminOSupervisor) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const now = new Date();
    const expiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 días

    const created = await Promise.all(
      archivos.map((archivo) => {
        const url = typeof archivo.url === "string" ? archivo.url.trim() : "";
        const tipo = archivo.tipo;

        if (!url) {
          return null;
        }

        if (tipo !== "FOTO" && tipo !== "VIDEO") {
          return null;
        }

        return prisma.archivoOrden.create({
          data: {
            ordenId: id,
            url,
            tipo,
            fechaEliminacionProgramada: expiry,
          },
        });
      }),
    );

    const filtered = created.filter(Boolean);

    if (filtered.length === 0) {
      return NextResponse.json(
        { error: "Ningún archivo válido para registrar" },
        { status: 400 },
      );
    }

    return NextResponse.json({ archivos: filtered });
  } catch (error) {
    console.error("Error registrando archivos de orden:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error interno del servidor al registrar los archivos.",
      },
      { status: 500 },
    );
  }
};

export const POST = withValidation(
  RegistrarArchivosOrdenSchema,
  registrarArchivosHandler,
);
