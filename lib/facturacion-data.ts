import { prisma } from "@/lib/prisma";
import { calcularCobroOrden } from "@/lib/facturacion-helpers";
import type { BillingConcept } from "@/lib/facturacion-helpers";
import type { TipoCliente } from "@prisma/client";

const BILLING_CACHE_TTL_MS = 2 * 60_000;

type BillingCacheEntry = {
  dataset: BillingDataset;
  expiresAt: number;
};

const billingDatasetCache = new Map<string, BillingCacheEntry>();

function makeBillingCacheKey(input: { proyectoId: string; desde: string; hasta: string }) {
  return `${input.proyectoId}::${input.desde}::${input.hasta}`;
}

export type ConceptSummary = {
  armado: number;
  tamano: number;
  distancia: number;
  penalizacion: number;
  prioridad: number;
};

export type BillingOrderRow = {
  id: string;
  codigoReferenciaRetail: string;
  fechaCompletado: Date | null;
  estado: string;
  clienteNombre: string;
  municipio: string;
  conceptos: BillingConcept[];
  resumen: ConceptSummary;
  total: number;
};

export type BillingProjectInfo = {
  id: string;
  nombreComercial: string;
  tipoCliente: TipoCliente;
  datosFacturacion: unknown;
};

export type BillingRange = { start: Date; end: Date };

export type BillingDataset = {
  proyecto: BillingProjectInfo;
  range: BillingRange;
  periodoLabel: string;
  ordenes: BillingOrderRow[];
  totalsByConcept: ConceptSummary & { totalFacturado: number };
};

export function getDateRange(desde: string, hasta: string): BillingRange | null {
  if (!desde || !hasta) return null;

  const start = new Date(`${desde}T00:00:00.000Z`);
  const end = new Date(`${hasta}T23:59:59.999Z`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  if (start > end) return null;

  return { start, end };
}

export function summarizeConcepts(conceptos: BillingConcept[]): ConceptSummary {
  const summary: ConceptSummary = {
    armado: 0,
    tamano: 0,
    distancia: 0,
    penalizacion: 0,
    prioridad: 0,
  };

  for (const concepto of conceptos) {
    switch (concepto.tipo) {
      case "ARMADO":
        summary.armado += concepto.monto;
        break;
      case "TAMANO":
        summary.tamano += concepto.monto;
        break;
      case "DISTANCIA":
        summary.distancia += concepto.monto;
        break;
      case "PENALIZACION":
        summary.penalizacion += concepto.monto;
        break;
      case "PRIORIDAD":
        summary.prioridad += concepto.monto;
        break;
      default:
        break;
    }
  }

  return summary;
}

export async function getBillingDataset(input: {
  proyectoId: string;
  desde: string;
  hasta: string;
}): Promise<BillingDataset | null> {
  const cacheKey = makeBillingCacheKey(input);
  const now = Date.now();
  const cached = billingDatasetCache.get(cacheKey);

  if (cached && cached.expiresAt > now) {
    return cached.dataset;
  }

  const range = getDateRange(input.desde, input.hasta);
  if (!range) return null;

  const proyecto = await prisma.proyecto.findFirst({
    where: { id: input.proyectoId, activo: true },
    include: {
      reglaCobro: {
        include: {
          rangosVolumen: true,
          cobrosDistancia: true,
          penalizaciones: true,
        },
      },
    },
  });

  if (!proyecto) {
    return null;
  }

  const ordenesRaw = await prisma.orden.findMany({
    where: {
      proyectoId: input.proyectoId,
      estado: "ARMADO_COMPLETADO",
      fechaCompletado: {
        gte: range.start,
        lte: range.end,
      },
    },
    orderBy: { fechaCompletado: "asc" },
    include: {
      usuarioFinal: true,
      mueble: true,
      penalizacionesAplicadas: true,
    },
  });

  const ordenesValidas = ordenesRaw.filter((orden) => orden.usuarioFinal && orden.mueble);

  if (ordenesValidas.length !== ordenesRaw.length) {
    console.warn(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        tipo: "FACTURACION_ORDENES_INCOMPLETAS",
        proyectoId: input.proyectoId,
        desde: input.desde,
        hasta: input.hasta,
        totalOrdenes: ordenesRaw.length,
        ordenesValidas: ordenesValidas.length,
      }),
    );
  }

  const reglaCobro = proyecto.reglaCobro
    ? {
        ...proyecto.reglaCobro,
        rangosVolumen: proyecto.reglaCobro.rangosVolumen,
        cobrosDistancia: proyecto.reglaCobro.cobrosDistancia,
        penalizaciones: proyecto.reglaCobro.penalizaciones,
      }
    : null;

  if (!proyecto.reglaCobro) {
    console.warn(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        tipo: "FACTURACION_REGLA_COBRO_FALTANTE",
        proyectoId: input.proyectoId,
        desde: input.desde,
        hasta: input.hasta,
      }),
    );
  }

  const ordenes: BillingOrderRow[] = ordenesValidas.map((orden) => {
    const calculo = calcularCobroOrden({
      orden,
      usuarioFinal: orden.usuarioFinal,
      mueble: orden.mueble,
      reglaCobro,
      penalizacionesAplicadas: orden.penalizacionesAplicadas,
    });

    const resumen = summarizeConcepts(calculo.conceptos);

    return {
      id: orden.id,
      codigoReferenciaRetail: orden.codigoReferenciaRetail,
      fechaCompletado: orden.fechaCompletado,
      estado: orden.estado,
      clienteNombre: orden.usuarioFinal.nombre,
      municipio: orden.usuarioFinal.municipio,
      conceptos: calculo.conceptos,
      resumen,
      total: calculo.total,
    };
  });

  const totalsByConcept = ordenes.reduce<ConceptSummary & { totalFacturado: number }>(
    (acc, orden) => {
      acc.armado += orden.resumen.armado;
      acc.tamano += orden.resumen.tamano;
      acc.distancia += orden.resumen.distancia;
      acc.penalizacion += orden.resumen.penalizacion;
      acc.prioridad += orden.resumen.prioridad;
      acc.totalFacturado += orden.total;
      return acc;
    },
    {
      armado: 0,
      tamano: 0,
      distancia: 0,
      penalizacion: 0,
      prioridad: 0,
      totalFacturado: 0,
    },
  );

  const periodoLabel = `${range.start.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })} - ${range.end.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })}`;

  const dataset: BillingDataset = {
    proyecto: {
      id: proyecto.id,
      nombreComercial: proyecto.nombreComercial,
      tipoCliente: proyecto.tipoCliente,
      datosFacturacion: proyecto.datosFacturacion,
    },
    range,
    periodoLabel,
    ordenes,
    totalsByConcept,
  };

  billingDatasetCache.set(cacheKey, {
    dataset,
    expiresAt: now + BILLING_CACHE_TTL_MS,
  });

  return dataset;
}
