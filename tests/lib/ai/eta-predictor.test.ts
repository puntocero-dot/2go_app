import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma y Redis
vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: vi.fn(),
    usuarioFinal: { findMany: vi.fn() },
  },
}));

vi.mock("@upstash/redis", () => ({
  Redis: vi.fn().mockImplementation(() => ({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue("OK"),
  })),
}));

import { aplicarCorreccionETA } from "@/lib/ai/eta-predictor";

describe("aplicarCorreccionETA", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna rango con factor default (1.3) cuando no hay datos históricos", async () => {
    const mapboxSegundos = 1200; // 20 minutos
    const result = await aplicarCorreccionETA(mapboxSegundos, "Soyapango");

    // Central = 20 * 1.3 = 26 minutos = 1560s
    expect(result.segundosCentral).toBe(1560);
    expect(result.segundosMin).toBeLessThan(result.segundosCentral);
    expect(result.segundosMax).toBeGreaterThan(result.segundosCentral);
    expect(result.factor).toBe(1.3);
    expect(result.municipio).toBe("Soyapango");
  });

  it("el rango min es 85% del central", async () => {
    const result = await aplicarCorreccionETA(600, "San Salvador");
    expect(result.segundosMin).toBe(Math.round(result.segundosCentral * 0.85));
  });

  it("el rango max es 120% del central", async () => {
    const result = await aplicarCorreccionETA(600, "San Salvador");
    expect(result.segundosMax).toBe(Math.round(result.segundosCentral * 1.2));
  });

  it("retorna minutos enteros (no decimales)", async () => {
    const result = await aplicarCorreccionETA(1000, "Mejicanos");
    expect(Number.isInteger(result.segundosCentral)).toBe(true);
    expect(Number.isInteger(result.segundosMin)).toBe(true);
    expect(Number.isInteger(result.segundosMax)).toBe(true);
  });
});
