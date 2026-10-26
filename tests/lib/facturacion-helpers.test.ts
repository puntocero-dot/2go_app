import { describe, it, expect } from "vitest";
import {
  calcularRecargoPrioridad,
  calcularCobroOrden,
  type BillingInput,
} from "@/lib/facturacion-helpers";
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

type ReglaCobroWithChildren = ReglaCobro & {
  rangosVolumen: RangoVolumen[];
  cobrosDistancia: CobroDistancia[];
  penalizaciones: Penalizacion[];
};

function buildReglaCobro(overrides: Partial<ReglaCobroWithChildren> = {}): ReglaCobroWithChildren {
  return {
    id: "regla-1",
    proyectoId: "proyecto-1",
    tipoPrincipal: "COBRO_FIJO_UNITARIO",
    precioFijoUnitario: 10,
    precioVIP: 0,
    precioUrgente: 0,
    precioMedia: 0,
    precioNormal: 0,
    precioGrande: 0,
    precioMediano: 0,
    precioPequeno: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    rangosVolumen: [],
    cobrosDistancia: [],
    penalizaciones: [],
    ...overrides,
  } as ReglaCobroWithChildren;
}

function buildOrden(overrides: Record<string, unknown> = {}): Orden {
  return {
    id: "orden-1",
    prioridad: "NORMAL",
    ...overrides,
  } as unknown as Orden;
}

function buildUsuarioFinal(overrides: Partial<UsuarioFinal> = {}): UsuarioFinal {
  return {
    id: "usuario-1",
    municipio: "San Salvador",
    ...overrides,
  } as unknown as UsuarioFinal;
}

function buildMueble(overrides: Partial<Mueble> = {}): Mueble {
  return {
    id: "mueble-1",
    tamano: "MEDIANO",
    ...overrides,
  } as unknown as Mueble;
}

function buildInput(overrides: Partial<BillingInput> = {}): BillingInput {
  return {
    orden: buildOrden(),
    usuarioFinal: buildUsuarioFinal(),
    mueble: buildMueble(),
    reglaCobro: buildReglaCobro(),
    penalizacionesAplicadas: [],
    ...overrides,
  };
}

describe("lib/facturacion-helpers", () => {
  describe("calcularRecargoPrioridad", () => {
    const regla = buildReglaCobro({
      precioVIP: 50,
      precioUrgente: 30,
      precioMedia: 15,
      precioNormal: 0,
    });

    it("devuelve el precio VIP para prioridad VIP", () => {
      expect(calcularRecargoPrioridad(buildOrden({ prioridad: "VIP" }), regla)).toBe(50);
    });

    it("devuelve el precio URGENTE para prioridad URGENTE", () => {
      expect(calcularRecargoPrioridad(buildOrden({ prioridad: "URGENTE" }), regla)).toBe(30);
    });

    it("devuelve 0 para una prioridad desconocida", () => {
      expect(calcularRecargoPrioridad(buildOrden({ prioridad: "INEXISTENTE" }), regla)).toBe(0);
    });
  });

  describe("calcularCobroOrden", () => {
    it("retorna total 0 y un concepto explicativo si no hay regla de cobro", () => {
      const result = calcularCobroOrden(buildInput({ reglaCobro: null }));
      expect(result.total).toBe(0);
      expect(result.conceptos).toHaveLength(1);
      expect(result.conceptos[0].tipo).toBe("ARMADO");
    });

    it("cobra el precio fijo unitario como base de armado", () => {
      const result = calcularCobroOrden(
        buildInput({ reglaCobro: buildReglaCobro({ precioFijoUnitario: 25 }) })
      );
      expect(result.total).toBe(25);
      const armado = result.conceptos.find((c) => c.tipo === "ARMADO");
      expect(armado?.monto).toBe(25);
    });

    it("suma el recargo por prioridad al total", () => {
      const result = calcularCobroOrden(
        buildInput({
          orden: buildOrden({ prioridad: "VIP" }),
          reglaCobro: buildReglaCobro({ precioFijoUnitario: 20, precioVIP: 15 }),
        })
      );
      expect(result.total).toBe(35); // 20 base + 15 VIP
      expect(result.conceptos.some((c) => c.tipo === "PRIORIDAD" && c.monto === 15)).toBe(true);
    });

    it("suma el recargo por tamaño de mueble", () => {
      const result = calcularCobroOrden(
        buildInput({
          mueble: buildMueble({ tamano: "GRANDE" }),
          reglaCobro: buildReglaCobro({ precioFijoUnitario: 10, precioGrande: 8 }),
        })
      );
      expect(result.total).toBe(18); // 10 base + 8 tamaño
    });

    it("cobra por municipio solo si coincide (sin distinguir mayúsculas/espacios)", () => {
      const reglaCobro = buildReglaCobro({
        precioFijoUnitario: 0,
        cobrosDistancia: [
          { id: "c1", reglaCobroId: "regla-1", municipio: "  SAN SALVADOR  ", precio: 12 } as CobroDistancia,
        ],
      });
      const result = calcularCobroOrden(
        buildInput({ usuarioFinal: buildUsuarioFinal({ municipio: "san salvador" }), reglaCobro })
      );
      expect(result.total).toBe(12);
      expect(result.conceptos.some((c) => c.tipo === "DISTANCIA")).toBe(true);
    });

    it("no cobra distancia si el municipio no coincide con ningún cobro configurado", () => {
      const reglaCobro = buildReglaCobro({
        precioFijoUnitario: 0,
        cobrosDistancia: [
          { id: "c1", reglaCobroId: "regla-1", municipio: "Santa Ana", precio: 12 } as CobroDistancia,
        ],
      });
      const result = calcularCobroOrden(
        buildInput({ usuarioFinal: buildUsuarioFinal({ municipio: "San Salvador" }), reglaCobro })
      );
      expect(result.total).toBe(0);
      expect(result.conceptos.some((c) => c.tipo === "DISTANCIA")).toBe(false);
    });

    it("suma penalizaciones aplicadas e ignora las de monto 0", () => {
      const penalizacionesAplicadas = [
        { id: "p1", tipo: "RETRASO", descripcion: "Llegó tarde", monto: 5 } as unknown as PenalizacionAplicada,
        { id: "p2", tipo: "OTRA", descripcion: null, monto: 0 } as unknown as PenalizacionAplicada,
      ];
      const result = calcularCobroOrden(
        buildInput({
          reglaCobro: buildReglaCobro({ precioFijoUnitario: 0 }),
          penalizacionesAplicadas,
        })
      );
      expect(result.total).toBe(5);
      const penalizacionesConcepto = result.conceptos.filter((c) => c.tipo === "PENALIZACION");
      expect(penalizacionesConcepto).toHaveLength(1);
      expect(penalizacionesConcepto[0].descripcion).toContain("Llegó tarde");
    });

    it("usa el rango de volumen correcto en COBRO_POR_VOLUMEN", () => {
      const reglaCobro = buildReglaCobro({
        tipoPrincipal: "COBRO_POR_VOLUMEN",
        precioFijoUnitario: 0,
        rangosVolumen: [
          { id: "r1", reglaCobroId: "regla-1", desde: 1, hasta: 5, precio: 7 } as RangoVolumen,
        ],
      });
      // calcularCobroOrden asume cantidad=1 por orden hoy
      const result = calcularCobroOrden(buildInput({ reglaCobro }));
      expect(result.total).toBe(7);
    });

    it("suma todos los conceptos aplicables en un caso combinado", () => {
      const reglaCobro = buildReglaCobro({
        precioFijoUnitario: 20,
        precioVIP: 15,
        precioGrande: 8,
        cobrosDistancia: [
          { id: "c1", reglaCobroId: "regla-1", municipio: "San Salvador", precio: 12 } as CobroDistancia,
        ],
      });
      const result = calcularCobroOrden(
        buildInput({
          orden: buildOrden({ prioridad: "VIP" }),
          mueble: buildMueble({ tamano: "GRANDE" }),
          usuarioFinal: buildUsuarioFinal({ municipio: "San Salvador" }),
          reglaCobro,
          penalizacionesAplicadas: [
            { id: "p1", tipo: "DANO", descripcion: null, monto: 10 } as unknown as PenalizacionAplicada,
          ],
        })
      );
      // 20 base + 15 VIP + 8 grande + 12 distancia + 10 penalizacion
      expect(result.total).toBe(65);
    });
  });
});
