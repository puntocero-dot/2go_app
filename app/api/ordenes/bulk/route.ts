import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { PrioridadUsuario, Prisma, TamanoMueble } from "@prisma/client";
import { withRateLimit } from "@/lib/api-helpers";
import { logAuditFromSession } from "@/lib/audit-logger";

const REQUIRED_HEADERS = [
  "codigoReferenciaRetail",
  "proyecto",
  "clienteNombre",
  "clienteTelefono",
  "clienteDireccion",
  "clienteMunicipio",
  "clienteDepartamento",
  "muebleTamano",
  "muebleNombre",
];

const OPTIONAL_HEADERS = [
  "clienteEmail",
  "muebleSKU",
  "notasEntrega",
  "fechaSolicitada",
  "prioridad",
  "clientePrioridad",
];

const PRIORIDADES_VALIDAS: PrioridadUsuario[] = [
  "VIP",
  "URGENTE",
  "MEDIA",
  "NORMAL",
];

const TAMANOS_VALIDOS: TamanoMueble[] = ["GRANDE", "MEDIANO", "PEQUENO"];

type BulkRow = {
  codigoReferenciaRetail: string;
  proyecto: string;
  clienteNombre: string;
  clienteTelefono: string;
  clienteEmail?: string;
  clienteDireccion: string;
  clienteMunicipio: string;
  clienteDepartamento: string;
  muebleTamano: TamanoMueble;
  muebleNombre: string;
  muebleSKU?: string;
  notasEntrega?: string;
  fechaSolicitada?: string;
  prioridad?: PrioridadUsuario;
  clientePrioridad?: PrioridadUsuario;
};

function buildRowKey(data: BulkRow): string {
  // Clave normalizada para detectar filas duplicadas dentro del mismo archivo
  return [
    data.codigoReferenciaRetail.trim().toLowerCase(),
    data.proyecto.trim().toLowerCase(),
    data.clienteNombre.trim().toLowerCase(),
    data.clienteTelefono.trim(),
    data.clienteDireccion.trim().toLowerCase(),
    data.clienteMunicipio.trim().toLowerCase(),
    data.clienteDepartamento.trim().toLowerCase(),
    data.muebleTamano,
    data.muebleNombre.trim().toLowerCase(),
    (data.muebleSKU ?? "").trim().toLowerCase(),
    (data.fechaSolicitada ?? "").trim(),
  ].join("|");
}

type BulkResult =
  | {
      status: "success";
      row: number;
      codigoReferenciaRetail: string;
      orderId: string;
      autoAssigned: boolean;
      message?: string;
    }
  | {
      status: "error";
      row: number;
      codigoReferenciaRetail?: string;
      message: string;
    };

const bulkHandler = async (request: NextRequest): Promise<Response> => {
  try {
    const session = await getSession();

    if (!session || !["ADMIN", "SUPERVISOR"].includes(session.rol)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const rawBody = await request.text();
    if (!rawBody.trim()) {
      return NextResponse.json(
        { error: "El archivo CSV está vacío" },
        { status: 400 }
      );
    }

    let parseResult;
    try {
      parseResult = parseCsv(rawBody);
      validateHeaders(parseResult.headers);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Formato de CSV inválido";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (parseResult.rows.length === 0) {
      return NextResponse.json(
        { error: "No se encontraron filas en el CSV" },
        { status: 400 }
      );
    }

    const results: BulkResult[] = [];
    const seenKeys = new Set<string>();

    for (const row of parseResult.rows) {
      const lineNumber = row.lineNumber;
      try {
        const data = mapRowToData(row.values);

        // Evitar filas duplicadas dentro del mismo archivo
        const dedupeKey = buildRowKey(data);
        if (seenKeys.has(dedupeKey)) {
          throw new Error(
            `Fila duplicada en el archivo para el código ${data.codigoReferenciaRetail} y cliente ${data.clienteNombre}.`
          );
        }
        seenKeys.add(dedupeKey);

        const result = await processRow(data, session.userId);
        results.push({
          status: "success",
          row: lineNumber,
          codigoReferenciaRetail: data.codigoReferenciaRetail,
          orderId: result.orderId,
          autoAssigned: result.autoAssigned,
          message: result.autoAssigned
            ? "Orden creada y auto-asignada"
            : "Orden creada. Pendiente asignación",
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Error inesperado";
        results.push({
          status: "error",
          row: lineNumber,
          codigoReferenciaRetail: row.values.codigoReferenciaRetail,
          message,
        });
      }
    }

    const successCount = results.filter((r) => r.status === "success").length;
    const errorCount = results.length - successCount;

    await logAuditFromSession({
      session,
      action: "BULK_OPERATION",
      resource: "orden",
      changes: {
        after: {
          processed: results.length,
          success: successCount,
          errors: errorCount,
        },
      },
      request,
    });

    return NextResponse.json({
      summary: {
        processed: results.length,
        success: successCount,
        errors: errorCount,
      },
      results,
    });
  } catch (error) {
    console.error("Error en carga masiva de órdenes:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
};

export const POST = withRateLimit(
  bulkHandler,
  {
    // Límite específico para cargas masivas: por defecto 5 por hora
    windowMs: 60 * 60 * 1000,
    maxRequests: parseInt(process.env.RATE_LIMIT_BULK_ORDERS || "5"),
  },
  (request) => {
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
    return `ordenes-bulk:${ip}`;
  },
);

function parseCsv(content: string) {
  const cleaned = content.replace(/^\uFEFF/, "");
  const lines = cleaned
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.trim());
  const rows = lines.slice(1).map((line, index) => ({
    lineNumber: index + 2,
    values: toRecord(headers, parseCsvLine(line)),
  }));

  return { headers, rows };
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      const nextChar = line[i + 1];
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function toRecord(headers: string[], values: string[]): Record<string, string> {
  const record: Record<string, string> = {};
  headers.forEach((header, index) => {
    record[header] = (values[index] ?? "").trim();
  });
  return record;
}

function validateHeaders(headers: string[]) {
  for (const header of REQUIRED_HEADERS) {
    if (!headers.includes(header)) {
      throw new Error(`Falta la columna obligatoria "${header}"`);
    }
  }

  const allowed = new Set([...REQUIRED_HEADERS, ...OPTIONAL_HEADERS]);
  const unknown = headers.filter((header) => !allowed.has(header));
  if (unknown.length > 0) {
    throw new Error(
      `Columnas no reconocidas: ${unknown.join(", ")}. Verifica el formato.`
    );
  }
}

function mapRowToData(values: Record<string, string>): BulkRow {
  const codigoReferenciaRetail = values.codigoReferenciaRetail;
  const proyecto = values.proyecto;
  const clienteNombre = values.clienteNombre;
  const clienteTelefono = values.clienteTelefono;
  const clienteDireccion = values.clienteDireccion;
  const clienteMunicipio = values.clienteMunicipio;
  const clienteDepartamento = values.clienteDepartamento;
  const muebleTamano = normalizeTamano(values.muebleTamano);
  const muebleNombre = values.muebleNombre;

  if (!codigoReferenciaRetail || !proyecto || !clienteNombre || !clienteTelefono || !clienteDireccion || !clienteMunicipio || !clienteDepartamento || !muebleTamano || !muebleNombre) {
    throw new Error("Faltan campos obligatorios en la fila");
  }

  const prioridad = normalizePrioridad(values.prioridad ?? values.clientePrioridad);
  const clientePrioridad = normalizePrioridad(values.clientePrioridad ?? values.prioridad);

  return {
    codigoReferenciaRetail,
    proyecto,
    clienteNombre,
    clienteTelefono,
    clienteEmail: values.clienteEmail || undefined,
    clienteDireccion,
    clienteMunicipio,
    clienteDepartamento,
    muebleTamano,
    muebleNombre,
    muebleSKU: values.muebleSKU || undefined,
    notasEntrega: values.notasEntrega || undefined,
    fechaSolicitada: values.fechaSolicitada || undefined,
    prioridad,
    clientePrioridad,
  };
}

function normalizeTamano(value?: string): TamanoMueble {
  if (!value) {
    throw new Error("muebleTamano es obligatorio");
  }

  const sanitized = removeDiacritics(value)
    .toUpperCase()
    .replace(/[^A-Z]/g, "");

  if (sanitized.includes("GRAND")) {
    return "GRANDE";
  }
  if (sanitized.includes("MEDIAN")) {
    return "MEDIANO";
  }
  if (sanitized.includes("PEQUEN") || sanitized.includes("PEQUE")) {
    return "PEQUENO";
  }

  throw new Error(
    `Tamaño de mueble inválido (${value}). Valores permitidos: ${TAMANOS_VALIDOS.join(", ")}`
  );
}

function normalizePrioridad(value?: string): PrioridadUsuario | undefined {
  if (!value) return undefined;
  const upper = value.trim().toUpperCase();
  if (!PRIORIDADES_VALIDAS.includes(upper as PrioridadUsuario)) {
    throw new Error(
      `Prioridad inválida (${value}). Valores permitidos: ${PRIORIDADES_VALIDAS.join(", ")}`
    );
  }
  return upper as PrioridadUsuario;
}

async function processRow(data: BulkRow, userId: string) {
  const proyecto = await prisma.proyecto.findFirst({
    where: {
      nombreComercial: {
        equals: data.proyecto,
        mode: "insensitive",
      },
    },
  });

  if (!proyecto) {
    throw new Error(`Proyecto "${data.proyecto}" no existe`);
  }

  const prioridadOrden = data.prioridad ?? "NORMAL";
  const prioridadCliente = data.clientePrioridad ?? prioridadOrden;

  const cliente = await upsertCliente({
    proyectoId: proyecto.id,
    nombre: data.clienteNombre,
    telefono: data.clienteTelefono,
    email: data.clienteEmail,
    direccion: data.clienteDireccion,
    municipio: data.clienteMunicipio,
    departamento: data.clienteDepartamento,
    prioridad: prioridadCliente,
  });

  const mueble = await upsertMueble({
    proyectoId: proyecto.id,
    tamano: data.muebleTamano,
    nombre: data.muebleNombre,
    sku: data.muebleSKU,
  });

  const fechaSolicitada = data.fechaSolicitada
    ? parseDate(data.fechaSolicitada)
    : null;

  // Validación adicional: evitar crear pedidos muy similares ya existentes
  // en el mismo proyecto para el mismo cliente y mueble.
  const existingSimilarOrder = await prisma.orden.findFirst({
    where: {
      proyectoId: proyecto.id,
      codigoReferenciaRetail: data.codigoReferenciaRetail,
    },
  });

  if (existingSimilarOrder) {
    throw new Error(
      `Ya existe una orden con el código ${data.codigoReferenciaRetail} en el proyecto "${data.proyecto}".`,
    );
  }

  const orden = await prisma.orden.create({
    data: {
      codigoReferenciaRetail: data.codigoReferenciaRetail,
      proyectoId: proyecto.id,
      usuarioFinalId: cliente.id,
      muebleId: mueble.id,
      fechaSolicitadaCliente: fechaSolicitada,
      estado: "SIN_ASIGNAR",
      prioridad: prioridadOrden,
      desgloseCobro: data.notasEntrega
        ? {
            notasEntrega: data.notasEntrega,
          }
        : undefined,
    } as Prisma.OrdenUncheckedCreateInput,
    include: {
      proyecto: true,
      usuarioFinal: true,
      mueble: true,
    },
  });

  // En carga masiva dejamos todas las órdenes en estado SIN_ASIGNAR
  // para que la asignación se haga luego de forma manual o masiva desde la UI.
  return { orderId: orden.id, autoAssigned: false };
}

async function upsertCliente(params: {
  proyectoId: string;
  nombre: string;
  telefono: string;
  email?: string;
  direccion: string;
  municipio: string;
  departamento: string;
  prioridad: PrioridadUsuario;
}) {
  const { proyectoId, telefono, email } = params;

  let cliente = await prisma.usuarioFinal.findFirst({
    where: {
      proyectoId,
      telefono,
    },
  });

  if (!cliente && email) {
    cliente = await prisma.usuarioFinal.findFirst({
      where: {
        proyectoId,
        email,
      },
    });
  }

  if (cliente) {
    // Actualizar prioridad si se proporcionó una diferente
    if (params.prioridad && cliente.prioridad !== params.prioridad) {
      cliente = await prisma.usuarioFinal.update({
        where: { id: cliente.id },
        data: {
          prioridad: params.prioridad,
        },
      });
    }
    return cliente;
  }

  return prisma.usuarioFinal.create({
    data: {
      nombre: params.nombre,
      telefono: params.telefono,
      email: params.email || null,
      direccionCompleta: params.direccion,
      municipio: params.municipio,
      departamento: params.departamento,
      prioridad: params.prioridad,
      proyectoId: params.proyectoId,
    },
  });
}

async function upsertMueble(params: {
  proyectoId: string;
  nombre: string;
  tamano: TamanoMueble;
  sku?: string;
}) {
  const { proyectoId, nombre, sku } = params;

  let mueble: Prisma.PromiseReturnType<typeof prisma.mueble.findFirst> | null = null;

  if (sku) {
    mueble = await prisma.mueble.findFirst({
      where: {
        proyectoId,
        descripcion: {
          contains: sku,
          mode: "insensitive",
        },
      },
    });
  }

  if (!mueble) {
    mueble = await prisma.mueble.findFirst({
      where: {
        proyectoId,
        nombre: {
          equals: nombre,
          mode: "insensitive",
        },
      },
    });
  }

  if (mueble) {
    return mueble;
  }

  return prisma.mueble.create({
    data: {
      nombre: params.nombre,
      tamano: params.tamano,
      descripcion: params.sku ? `SKU: ${params.sku}` : null,
      proyectoId: params.proyectoId,
    },
  });
}

function parseDate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  let date: Date;

  // Formato ISO flexible: AAAA-MM-D o AAAA-M-D
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    const year = Number(y);
    const month = Number(m);
    const day = Number(d);
    if (!isValidYMD(year, month, day)) {
      throw new Error(
        `Fecha solicitada inválida (${value}). Usa el formato AAAA-MM-DD (por ejemplo 2025-03-15) o DD/MM/AAAA (por ejemplo 15/03/2025).`
      );
    }
    const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    date = new Date(`${iso}T00:00:00`);
  } else {
    // Formatos con día/mes primero: D/M/AAAA, DD/MM/AAAA, D-M-AAAA, etc.
    const dmMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmMatch) {
      const [, d, m, y] = dmMatch;
      const day = Number(d);
      const month = Number(m);
      const year = Number(y);
      if (!isValidYMD(year, month, day)) {
        throw new Error(
          `Fecha solicitada inválida (${value}). Usa el formato AAAA-MM-DD (por ejemplo 2025-03-15) o DD/MM/AAAA (por ejemplo 15/03/2025).`
        );
      }
      const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      date = new Date(`${iso}T00:00:00`);
    } else {
      // Último intento: dejar que Date intente parsear
      date = new Date(trimmed);
    }
  }

  if (Number.isNaN(date.getTime())) {
    throw new Error(
      `Fecha solicitada inválida (${value}). Usa el formato AAAA-MM-DD (por ejemplo 2025-03-15) o DD/MM/AAAA (por ejemplo 15/03/2025).`
    );
  }
  return date;
}

function isValidYMD(year: number, month: number, day: number) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false;
  }
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const test = new Date(`${iso}T00:00:00`);
  return !Number.isNaN(test.getTime()) &&
    test.getUTCFullYear() === year &&
    test.getUTCMonth() + 1 === month &&
    test.getUTCDate() === day;
}

function removeDiacritics(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
