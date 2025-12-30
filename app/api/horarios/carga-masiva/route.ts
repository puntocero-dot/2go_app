import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TipoTurno } from "@prisma/client";

const TIPOS_VALIDOS: TipoTurno[] = [
  "NORMAL",
  "EXTRA",
  "MEDIO_TIEMPO",
  "DESCANSO",
  "INCAPACIDAD",
  "VACACIONES",
  "AUSENCIA",
];

function parseCSV(content: string): string[][] {
  const lines = content.split(/\r?\n/).filter((line) => line.trim());
  return lines.map((line) => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  });
}

function validateTime(time: string): boolean {
  const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return regex.test(time);
}

function validateDate(dateStr: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || !["ADMIN", "SUPERVISOR"].includes(session.rol)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó archivo" },
        { status: 400 }
      );
    }

    const content = await file.text();
    const rows = parseCSV(content);

    if (rows.length < 2) {
      return NextResponse.json(
        { error: "El archivo debe tener al menos una fila de datos además del encabezado" },
        { status: 400 }
      );
    }

    // Verificar encabezados
    const headers = rows[0].map((h) => h.toLowerCase().replace(/\s+/g, "_"));
    const requiredHeaders = ["armador_id", "fecha", "hora_inicio", "hora_fin", "tipo_turno"];
    const missingHeaders = requiredHeaders.filter(
      (h) => !headers.includes(h)
    );

    if (missingHeaders.length > 0) {
      return NextResponse.json(
        { error: `Faltan columnas requeridas: ${missingHeaders.join(", ")}` },
        { status: 400 }
      );
    }

    // Índices de columnas
    const armadorIdIdx = headers.indexOf("armador_id");
    const fechaIdx = headers.indexOf("fecha");
    const horaInicioIdx = headers.indexOf("hora_inicio");
    const horaFinIdx = headers.indexOf("hora_fin");
    const tipoTurnoIdx = headers.indexOf("tipo_turno");
    const notasIdx = headers.indexOf("notas");

    // Obtener armadores válidos
    const armadores = await prisma.armador.findMany({
      select: { id: true },
    });
    const armadorIds = new Set(armadores.map((a) => a.id));

    const errors: string[] = [];
    const toCreate: {
      armadorId: string;
      fecha: Date;
      horaInicio: string;
      horaFin: string;
      tipoTurno: TipoTurno;
      notas: string | null;
    }[] = [];

    // Procesar filas de datos
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const lineNum = i + 1;

      if (row.length < 5) {
        errors.push(`Línea ${lineNum}: Faltan columnas`);
        continue;
      }

      const armadorId = row[armadorIdIdx];
      const fecha = row[fechaIdx];
      const horaInicio = row[horaInicioIdx];
      const horaFin = row[horaFinIdx];
      const tipoTurno = row[tipoTurnoIdx]?.toUpperCase() as TipoTurno;
      const notas = notasIdx >= 0 ? row[notasIdx] || null : null;

      // Validaciones
      if (!armadorId) {
        errors.push(`Línea ${lineNum}: armador_id vacío`);
        continue;
      }

      if (!armadorIds.has(armadorId)) {
        errors.push(`Línea ${lineNum}: armador_id "${armadorId}" no existe`);
        continue;
      }

      if (!validateDate(fecha)) {
        errors.push(`Línea ${lineNum}: fecha inválida "${fecha}" (usar YYYY-MM-DD)`);
        continue;
      }

      if (!validateTime(horaInicio)) {
        errors.push(`Línea ${lineNum}: hora_inicio inválida "${horaInicio}" (usar HH:mm)`);
        continue;
      }

      if (!validateTime(horaFin)) {
        errors.push(`Línea ${lineNum}: hora_fin inválida "${horaFin}" (usar HH:mm)`);
        continue;
      }

      if (!TIPOS_VALIDOS.includes(tipoTurno)) {
        errors.push(`Línea ${lineNum}: tipo_turno inválido "${tipoTurno}"`);
        continue;
      }

      toCreate.push({
        armadorId,
        fecha: new Date(fecha),
        horaInicio,
        horaFin,
        tipoTurno,
        notas,
      });
    }

    if (toCreate.length === 0) {
      return NextResponse.json(
        {
          success: false,
          created: 0,
          updated: 0,
          errors: errors.length > 0 ? errors : ["No hay datos válidos para procesar"],
        },
        { status: 400 }
      );
    }

    // Upsert horarios
    let created = 0;
    let updated = 0;

    for (const item of toCreate) {
      const existing = await prisma.horarioProgramado.findUnique({
        where: {
          armadorId_fecha: {
            armadorId: item.armadorId,
            fecha: item.fecha,
          },
        },
      });

      if (existing) {
        await prisma.horarioProgramado.update({
          where: { id: existing.id },
          data: {
            horaInicio: item.horaInicio,
            horaFin: item.horaFin,
            tipoTurno: item.tipoTurno,
            notas: item.notas,
          },
        });
        updated++;
      } else {
        await prisma.horarioProgramado.create({
          data: item,
        });
        created++;
      }
    }

    return NextResponse.json({
      success: true,
      created,
      updated,
      errors,
    });
  } catch (error) {
    console.error("Error en carga masiva de horarios:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
