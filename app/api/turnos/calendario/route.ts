import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || !["ADMIN", "SUPERVISOR"].includes(session.rol)) {
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

    const fechaInicio = new Date(`${inicio}T00:00:00`);
    const fechaFin = new Date(`${fin}T23:59:59`);

    // Obtener horarios programados
    const horariosProgramados = await prisma.horarioProgramado.findMany({
      where: {
        fecha: {
          gte: fechaInicio,
          lte: fechaFin,
        },
      },
      include: {
        armador: {
          include: {
            usuario: { select: { nombre: true } },
          },
        },
      },
      orderBy: { fecha: "asc" },
    });

    // Obtener turnos reales
    const turnosReales = await prisma.turno.findMany({
      where: {
        inicioTurno: {
          gte: fechaInicio,
          lte: fechaFin,
        },
      },
      include: {
        armador: {
          include: {
            usuario: { select: { nombre: true } },
          },
        },
      },
      orderBy: { inicioTurno: "asc" },
    });

    // Formatear horarios programados
    const horariosProgramadosFormatted = horariosProgramados.map((h) => ({
      id: h.id,
      armadorId: h.armadorId,
      armadorNombre: h.armador.usuario.nombre,
      fecha: h.fecha.toISOString(),
      horaInicio: h.horaInicio,
      horaFin: h.horaFin,
      tipoTurno: h.tipoTurno,
      notas: h.notas,
    }));

    // Formatear turnos reales
    const turnosRealesFormatted = turnosReales.map((t) => {
      const duracionMinutos = t.finTurno
        ? Math.round(
            (new Date(t.finTurno).getTime() - new Date(t.inicioTurno).getTime()) /
              (1000 * 60)
          )
        : Math.round(
            (Date.now() - new Date(t.inicioTurno).getTime()) / (1000 * 60)
          );

      return {
        id: t.id,
        armadorId: t.armadorId,
        armadorNombre: t.armador.usuario.nombre,
        fecha: t.inicioTurno.toISOString(),
        horaInicio: format(new Date(t.inicioTurno), "HH:mm"),
        horaFin: t.finTurno ? format(new Date(t.finTurno), "HH:mm") : null,
        duracionMinutos,
      };
    });

    return NextResponse.json({
      horariosProgramados: horariosProgramadosFormatted,
      turnosReales: turnosRealesFormatted,
    });
  } catch (error) {
    console.error("Error en calendario de turnos:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
