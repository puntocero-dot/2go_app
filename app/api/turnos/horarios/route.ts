import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditFromSession } from "@/lib/audit-logger";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || !["ADMIN", "SUPERVISOR"].includes(session.rol)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const { armadorId, fecha, horaInicio, horaFin, tipoTurno, notas } = body;

    if (!armadorId || !fecha || !horaInicio || !horaFin) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Verificar que el armador existe
    const armador = await prisma.armador.findUnique({
      where: { id: armadorId },
    });

    if (!armador) {
      return NextResponse.json(
        { error: "Armador no encontrado" },
        { status: 404 }
      );
    }

    // Crear o actualizar horario programado
    const horario = await prisma.horarioProgramado.upsert({
      where: {
        armadorId_fecha: {
          armadorId,
          fecha: new Date(fecha),
        },
      },
      update: {
        horaInicio,
        horaFin,
        tipoTurno: tipoTurno || "NORMAL",
        notas: notas || null,
      },
      create: {
        armadorId,
        fecha: new Date(fecha),
        horaInicio,
        horaFin,
        tipoTurno: tipoTurno || "NORMAL",
        notas: notas || null,
      },
    });

    await logAuditFromSession({
      session,
      action: "CREATE_SCHEDULE",
      resource: "horario_programado",
      resourceId: horario.id,
      changes: {
        after: { armadorId, fecha, horaInicio, horaFin, tipoTurno },
      },
      request,
    });

    return NextResponse.json({ horario });
  } catch (error) {
    console.error("Error creando horario programado:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || !["ADMIN", "SUPERVISOR"].includes(session.rol)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Se requiere ID del horario" },
        { status: 400 }
      );
    }

    await prisma.horarioProgramado.delete({
      where: { id },
    });

    await logAuditFromSession({
      session,
      action: "DELETE_SCHEDULE",
      resource: "horario_programado",
      resourceId: id,
      request,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error eliminando horario programado:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
