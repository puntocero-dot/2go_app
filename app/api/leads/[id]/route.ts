import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditFromSession } from "@/lib/audit-logger";
import { ActualizarEstadoLeadSchema } from "@/lib/schemas/lead.schemas";

type RouteContext = { params: Promise<{ id: string }> };

// PATCH - Actualizar el estado de un lead capturado por 2GoBot
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getSession();

    if (!session || session.rol !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = ActualizarEstadoLeadSchema.parse(body);

    const lead = await prisma.proyecto.findFirst({ where: { id, esLead: true } });
    if (!lead) {
      return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });
    }

    const actualizado = await prisma.proyecto.update({
      where: { id },
      data: { estadoLead: data.estadoLead },
    });

    await logAuditFromSession({
      session,
      action: "UPDATE_LEAD_ESTADO",
      resource: "proyecto",
      resourceId: id,
      changes: { before: { estadoLead: lead.estadoLead }, after: { estadoLead: data.estadoLead } },
      request,
    });

    return NextResponse.json({ lead: actualizado });
  } catch (error) {
    console.error("Error actualizando lead:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
