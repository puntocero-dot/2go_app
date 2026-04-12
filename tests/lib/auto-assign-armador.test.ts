import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma antes de importar el módulo
vi.mock("@/lib/prisma", () => ({
  prisma: {
    armador: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/feature-flags", () => ({
  isFeatureEnabled: vi.fn(() => false), // flag AI_SMART_ASSIGNMENT off por defecto
}));

vi.mock("@/lib/ai/smart-assignment", () => ({
  seleccionarMejorArmador: vi.fn(),
}));

import { asignarArmadorAutomatico } from "@/lib/auto-assign-armador";
import { prisma } from "@/lib/prisma";

const mockPrisma = prisma as unknown as {
  armador: { findMany: ReturnType<typeof vi.fn> };
};

describe("asignarArmadorAutomatico (algoritmo estático)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna null si no hay armadores activos", async () => {
    mockPrisma.armador.findMany.mockResolvedValue([]);
    const result = await asignarArmadorAutomatico({ id: "o1", muebleId: "m1", usuarioFinalId: "u1" });
    expect(result).toBeNull();
  });

  it("selecciona al armador con menos carga activa", async () => {
    const armadorCargado = {
      id: "a1",
      ordenes: [{ id: "o1" }, { id: "o2" }, { id: "o3" }], // 3 órdenes activas
      usuario: { nombre: "Armador Cargado" },
    };
    const armadorLibre = {
      id: "a2",
      ordenes: [], // sin órdenes activas
      usuario: { nombre: "Armador Libre" },
    };

    mockPrisma.armador.findMany.mockResolvedValue([armadorCargado, armadorLibre]);

    const result = await asignarArmadorAutomatico({ id: "o99" });
    expect(result?.id).toBe("a2");
  });

  it("selecciona al único armador disponible", async () => {
    const armador = {
      id: "a1",
      ordenes: [],
      usuario: { nombre: "El Único" },
    };

    mockPrisma.armador.findMany.mockResolvedValue([armador]);
    const result = await asignarArmadorAutomatico({});
    expect(result?.id).toBe("a1");
  });
});
