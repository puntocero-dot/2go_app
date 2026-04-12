import { describe, it, expect } from "vitest";
import { calcularDistancia, calcularVelocidad } from "@/lib/geomaps-helpers";

describe("calcularDistancia", () => {
  it("retorna 0 cuando los puntos son iguales", () => {
    expect(calcularDistancia(13.6929, -89.2182, 13.6929, -89.2182)).toBe(0);
  });

  it("calcula distancia aproximada entre San Salvador y Santa Ana (~50 km lineal)", () => {
    // San Salvador: 13.6929, -89.2182
    // Santa Ana: 13.9979, -89.5594
    // Distancia en línea recta (Haversine) ≈ 50 km
    const distMetros = calcularDistancia(13.6929, -89.2182, 13.9979, -89.5594);
    const distKm = distMetros / 1000;
    expect(distKm).toBeGreaterThan(40);
    expect(distKm).toBeLessThan(65);
  });

  it("calcula distancia simétrica (A→B = B→A)", () => {
    const d1 = calcularDistancia(13.6929, -89.2182, 13.7, -89.3);
    const d2 = calcularDistancia(13.7, -89.3, 13.6929, -89.2182);
    expect(Math.abs(d1 - d2)).toBeLessThan(0.001);
  });

  it("calcula distancia corta (dentro del mismo municipio) en metros", () => {
    // ~500m de diferencia
    const d = calcularDistancia(13.6929, -89.2182, 13.6974, -89.2182);
    expect(d).toBeGreaterThan(400);
    expect(d).toBeLessThan(600);
  });
});

describe("calcularVelocidad", () => {
  it("retorna 0 si el tiempo es 0", () => {
    const t = new Date();
    const v = calcularVelocidad(13.6929, -89.2182, t, 13.7, -89.3, t);
    expect(v).toBe(0);
  });

  it("calcula velocidad razonable para un recorrido urbano", () => {
    const t1 = new Date("2024-01-01T10:00:00Z");
    const t2 = new Date("2024-01-01T10:30:00Z"); // 30 minutos después

    // ~10 km en 30 min = ~20 km/h
    const v = calcularVelocidad(13.6929, -89.2182, t1, 13.78, -89.3, t2);
    expect(v).toBeGreaterThan(5);
    expect(v).toBeLessThan(60);
  });

  it("detecta velocidad excesiva (>80 km/h) para alerta", () => {
    const t1 = new Date("2024-01-01T10:00:00Z");
    const t2 = new Date("2024-01-01T10:10:00Z"); // 10 minutos

    // ~50 km en 10 min = 300 km/h → excesivo
    const v = calcularVelocidad(13.6929, -89.2182, t1, 14.1, -89.7, t2);
    expect(v).toBeGreaterThan(80);
  });
});
