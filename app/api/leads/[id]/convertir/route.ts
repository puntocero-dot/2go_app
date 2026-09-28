import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditFromSession } from "@/lib/audit-logger";

type RouteContext = { params: Promise<{ id: string }> };

// POST - Convierte un lead (Proyecto con esLead=true) en un cliente real:
// lo activa y lo saca de la vista de leads. El admin todavía debe completar
// tipoCliente/datosFacturacion reales desde /admin/proyectos/[id]/editar.
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getSession();

    if (!session || session.rol !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id } = await params;

    const lead = await prisma.proyecto.findFirst({ where: { id, esLead: true } });
    if (!lead) {
      return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });
    }

    const proyecto = await prisma.proyecto.update({
      where: { id },
      data: { esLead: false, activo: true, estadoLead: "CONVERTIDO" },
    });

    await logAuditFromSession({
      session,
      action: "CONVERT_LEAD_TO_PROYECTO",
      resource: "proyecto",
      resourceId: id,
      changes: { after: { esLead: false, activo: true, estadoLead: "CONVERTIDO" } },
      request,
    });

    return NextResponse.json({ proyecto });
  } catch (error) {
    console.error("Error convirtiendo lead:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
