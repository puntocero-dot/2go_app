import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    mueble: { findUnique: vi.fn() },
    usuarioFinal: { findUnique: vi.fn() },
    armador: { findMany: vi.fn(), findUnique: vi.fn() },
    orden: { groupBy: vi.fn() },
    $queryRaw: vi.fn(),
  },
}));

vi.mock("@/lib/geomaps-helpers", () => ({
  calcularDistancia: vi.fn(() => 5000), // 5 km por defecto
}));

import { calcularScoresArmadores } from "@/lib/ai/smart-assignment";
import { prisma } from "@/lib/prisma";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPrisma = prisma as any;

const mockOrden = { id: "o1", muebleId: "m1", usuarioFinalId: "u1" };

describe("calcularScoresArmadores", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mueble mediano
    mockPrisma.mueble.findUnique.mockResolvedValue({ tamano: "MEDIANO" });

    // Cliente con coordenadas
    mockPrisma.usuarioFinal.findUnique.mockResolvedValue({
      coordenadasLat: 13.69,
      coordenadasLng: -89.22,
    });

    // Sin historial por defecto
    mockPrisma.orden.groupBy.mockResolvedValue([]);
    mockPrisma.$queryRaw.mockResolvedValue([]);
  });

  it("retorna array vacío si no hay armadores activos", async () => {
    mockPrisma.armador.findMany.mockResolvedValue([]);
    const scores = await calcularScoresArmadores(mockOrden);
    expect(scores).toHaveLength(0);
  });

  it("retorna scores ordenados de mayor a menor", async () => {
    mockPrisma.armador.findMany.mockResolvedValue([
      { id: "a1", ubicacionActualLat: 13.7, ubicacionActualLng: -89.2, ordenes: [{ id: "o1" }, { id: "o2" }] },
      { id: "a2", ubicacionActualLat: 13.69, ubicacionActualLng: -89.22, ordenes: [] },
    ]);

    const scores = await calcularScoresArmadores(mockOrden);
    expect(scores.length).toBe(2);
    expect(scores[0].score).toBeGreaterThanOrEqual(scores[1].score);
  });

  it("penaliza armadores con más órdenes activas", async () => {
    mockPrisma.armador.findMany.mockResolvedValue([
      { id: "a1", ubicacionActualLat: null, ubicacionActualLng: null, ordenes: [{ id: "o1" }, { id: "o2" }] },
      { id: "a2", ubicacionActualLat: null, ubicacionActualLng: null, ordenes: [] },
    ]);

    const scores = await calcularScoresArmadores(mockOrden);
    const scoreA1 = scores.find((s) => s.armadorId === "a1")!;
    const scoreA2 = scores.find((s) => s.armadorId === "a2")!;

    expect(scoreA2.score).toBeGreaterThan(scoreA1.score);
    expect(scoreA1.breakdown.carga).toBe(-30); // 2 órdenes * -15
    expect(scoreA2.breakdown.carga).toBeCloseTo(0);
  });

  it("incluye breakdown con todos los componentes del score", async () => {
    mockPrisma.armador.findMany.mockResolvedValue([
      { id: "a1", ubicacionActualLat: null, ubicacionActualLng: null, ordenes: [] },
    ]);

    const scores = await calcularScoresArmadores(mockOrden);
    const { breakdown } = scores[0];

    expect(breakdown).toHaveProperty("carga");
    expect(breakdown).toHaveProperty("csat");
    expect(breakdown).toHaveProperty("velocidad");
    expect(breakdown).toHaveProperty("expertise");
    expect(breakdown).toHaveProperty("distancia");
  });
});
