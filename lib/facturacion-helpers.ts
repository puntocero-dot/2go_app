import type {
  CobroDistancia,
  Mueble,
  Orden,
  Penalizacion,
  PenalizacionAplicada,
  RangoVolumen,
  ReglaCobro,
  UsuarioFinal,
} from "@prisma/client";

export type BillingConceptType =
  | "ARMADO"
  | "DISTANCIA"
  | "PENALIZACION"
  | "PRIORIDAD"
  | "TAMANO";

export interface BillingConcept {
  tipo: BillingConceptType;
  descripcion: string;
  monto: number;
}

export interface BillingCalculationResult {
  total: number;
  conceptos: BillingConcept[];
}

type ReglaCobroWithChildren = ReglaCobro & {
  rangosVolumen: RangoVolumen[];
  cobrosDistancia: CobroDistancia[];
  penalizaciones: Penalizacion[];
};

export interface BillingInput {
  orden: Orden;
  usuarioFinal: UsuarioFinal;
  mueble: Mueble;
  reglaCobro: ReglaCobroWithChildren | null;
  penalizacionesAplicadas: PenalizacionAplicada[];
}

export function calcularRecargoPrioridad(
  orden: Pick<Orden, "prioridad">,
  reglaCobro: ReglaCobro | ReglaCobroWithChildren,
): number {
  switch (orden.prioridad) {
    case "VIP":
      return reglaCobro.precioVIP;
    case "URGENTE":
      return reglaCobro.precioUrgente;
    case "MEDIA":
      return reglaCobro.precioMedia;
    case "NORMAL":
      return reglaCobro.precioNormal;
    default:
      return 0;
  }
}

function findMunicipioCharge(
  municipioRaw: string,
  cobrosDistancia: CobroDistancia[],
): CobroDistancia | null {
  const target = municipioRaw.trim().toLowerCase();
  if (!target) return null;
  return (
    cobrosDistancia.find(
      (c) => c.municipio.trim().toLowerCase() === target,
    ) ?? null
  );
}

function calcularBasePorVolumen(
  regla: ReglaCobroWithChildren,
  cantidad: number,
): { monto: number; descripcion: string } {
  if (!regla.rangosVolumen.length || cantidad <= 0) {
    return { monto: 0, descripcion: "" };
  }

  const rango = regla.rangosVolumen.find((r) => {
    const withinDesde = cantidad >= r.desde;
    const withinHasta = r.hasta == null || cantidad <= r.hasta;
    return withinDesde && withinHasta;
  });

  if (!rango) {
    return {
      monto: 0,
      descripcion: "Sin rango de volumen aplicable",
    };
  }

  const monto = rango.precio * cantidad;
  return {
    monto,
    descripcion: `Volumen ${cantidad}u x ${rango.precio.toFixed(2)}`,
  };
}

export function calcularCobroOrden(input: BillingInput): BillingCalculationResult {
  const { orden, usuarioFinal, mueble, reglaCobro, penalizacionesAplicadas } =
    input;

  if (!reglaCobro) {
    return {
      total: 0,
      conceptos: [
        {
          tipo: "ARMADO",
          descripcion: "Sin regla de cobro configurada para el proyecto",
          monto: 0,
        },
      ],
    };
  }

  const conceptos: BillingConcept[] = [];

  // --- ARMADO (base + volumen) ---
  let totalArmado = 0;
  const partesDescripcion: string[] = [];

  if (reglaCobro.tipoPrincipal === "COBRO_FIJO_UNITARIO") {
    const base = reglaCobro.precioFijoUnitario ?? 0;
    if (base > 0) {
      totalArmado += base;
      partesDescripcion.push(`Base ${base.toFixed(2)}`);
    }
  } else if (reglaCobro.tipoPrincipal === "COBRO_POR_VOLUMEN") {
    // Por ahora asumimos 1 unidad por orden. Esto se puede ajustar cuando exista un campo de cantidad.
    const cantidad = 1;
    const { monto, descripcion } = calcularBasePorVolumen(reglaCobro, cantidad);
    if (monto > 0) {
      totalArmado += monto;
      if (descripcion) {
        partesDescripcion.push(descripcion);
      }
    }
  }

  // Recargos por prioridad de la orden
  const recargoPrioridad = calcularRecargoPrioridad(orden, reglaCobro);
  if (recargoPrioridad !== 0) {
    conceptos.push({
      tipo: "PRIORIDAD",
      descripcion: `Prioridad ${orden.prioridad}`,
      monto: recargoPrioridad,
    });
  }

  // Recargos por tamaño del mueble (separado de ARMADO)
  let recargoTamano = 0;
  switch (mueble.tamano) {
    case "GRANDE":
      recargoTamano = reglaCobro.precioGrande;
      break;
    case "MEDIANO":
      recargoTamano = reglaCobro.precioMediano;
      break;
    case "PEQUENO":
      recargoTamano = reglaCobro.precioPequeno;
      break;
    default:
      recargoTamano = 0;
  }
  if (recargoTamano !== 0) {
    conceptos.push({
      tipo: "TAMANO",
      descripcion: `Tamaño ${mueble.tamano}`,
      monto: recargoTamano,
    });
  }

  if (totalArmado !== 0 || partesDescripcion.length > 0) {
    conceptos.push({
      tipo: "ARMADO",
      descripcion:
        partesDescripcion.length > 0
          ? `Armado (${partesDescripcion.join(", ")})`
          : "Armado",
      monto: totalArmado,
    });
  }

  // --- DISTANCIA (municipio) ---
  const cobroMunicipio = findMunicipioCharge(
    usuarioFinal.municipio,
    reglaCobro.cobrosDistancia,
  );
  if (cobroMunicipio && cobroMunicipio.precio !== 0) {
    conceptos.push({
      tipo: "DISTANCIA",
      descripcion: `Distancia / municipio ${usuarioFinal.municipio}`,
      monto: cobroMunicipio.precio,
    });
  }

  // --- PENALIZACIONES APLICADAS ---
  if (penalizacionesAplicadas.length > 0) {
    for (const pen of penalizacionesAplicadas) {
      if (!pen.monto || pen.monto === 0) continue;
      const tipoLabel = pen.tipo.replace(/_/g, " ");
      const baseDescripcion = `Penalización ${tipoLabel}`;
      const descripcion = pen.descripcion
        ? `${baseDescripcion} - ${pen.descripcion}`
        : baseDescripcion;

      conceptos.push({
        tipo: "PENALIZACION",
        descripcion,
        monto: pen.monto,
      });
    }
  }

  const total = conceptos.reduce((acc, item) => acc + item.monto, 0);

  return {
    total,
    conceptos,
  };
}
