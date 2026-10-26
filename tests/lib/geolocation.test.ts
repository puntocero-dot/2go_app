import { describe, it, expect } from "vitest";
import {
  calcularDistancia,
  validarCoordenadas,
  formatearCoordenadas,
  calcularDistanciaTotal,
  formatearDistancia,
  calcularDuracion,
} from "@/lib/geolocation";

describe("lib/geolocation", () => {
  describe("calcularDistancia (Haversine)", () => {
    it("retorna 0 para el mismo punto", () => {
      expect(calcularDistancia(13.6929, -89.2182, 13.6929, -89.2182)).toBeCloseTo(0, 6);
    });

    it("calcula la distancia conocida San Salvador - Santa Ana (~55km reales por carretera, línea recta algo menor)", () => {
      // San Salvador (13.6929, -89.2182) a Santa Ana (13.9942, -89.5597)
      const distancia = calcularDistancia(13.6929, -89.2182, 13.9942, -89.5597);
      expect(distancia).toBeGreaterThan(40);
      expect(distancia).toBeLessThan(55);
    });

    it("es simétrica (A->B == B->A)", () => {
      const ab = calcularDistancia(13.6929, -89.2182, 13.9942, -89.5597);
      const ba = calcularDistancia(13.9942, -89.5597, 13.6929, -89.2182);
      expect(ab).toBeCloseTo(ba, 10);
    });
  });

  describe("validarCoordenadas", () => {
    it("acepta coordenadas dentro de rango", () => {
      expect(validarCoordenadas(13.6929, -89.2182)).toBe(true);
    });

    it("acepta los límites exactos", () => {
      expect(validarCoordenadas(90, 180)).toBe(true);
      expect(validarCoordenadas(-90, -180)).toBe(true);
    });

    it("rechaza latitud fuera de rango", () => {
      expect(validarCoordenadas(91, 0)).toBe(false);
      expect(validarCoordenadas(-91, 0)).toBe(false);
    });

    it("rechaza longitud fuera de rango", () => {
      expect(validarCoordenadas(0, 181)).toBe(false);
      expect(validarCoordenadas(0, -181)).toBe(false);
    });
  });

  describe("formatearCoordenadas", () => {
    it("usa N/E para valores positivos", () => {
      expect(formatearCoordenadas(13.6929, -89.2182)).toContain("N");
    });

    it("usa S/W para valores negativos", () => {
      expect(formatearCoordenadas(-13.6929, 89.2182)).toContain("S");
      expect(formatearCoordenadas(-13.6929, 89.2182)).toContain("E");
    });
  });

  describe("calcularDistanciaTotal", () => {
    it("retorna 0 con menos de 2 puntos", () => {
      expect(calcularDistanciaTotal([])).toBe(0);
      expect(calcularDistanciaTotal([{ latitud: 13.69, longitud: -89.21 }])).toBe(0);
    });

    it("suma la distancia de cada tramo consecutivo", () => {
      const puntos = [
        { latitud: 13.6929, longitud: -89.2182 },
        { latitud: 13.7, longitud: -89.22 },
        { latitud: 13.71, longitud: -89.23 },
      ];
      const total = calcularDistanciaTotal(puntos);
      const tramo1 = calcularDistancia(puntos[0].latitud, puntos[0].longitud, puntos[1].latitud, puntos[1].longitud);
      const tramo2 = calcularDistancia(puntos[1].latitud, puntos[1].longitud, puntos[2].latitud, puntos[2].longitud);
      expect(total).toBeCloseTo(tramo1 + tramo2, 10);
    });
  });

  describe("formatearDistancia", () => {
    it("muestra metros redondeados si es menor a 1km", () => {
      expect(formatearDistancia(0.5)).toBe("500 m");
    });

    it("muestra km con 2 decimales si es 1km o más", () => {
      expect(formatearDistancia(5.1234)).toBe("5.12 km");
    });
  });

  describe("calcularDuracion", () => {
    it("formatea minutos cuando dura menos de una hora", () => {
      const inicio = "2026-01-01T10:00:00Z";
      const fin = "2026-01-01T10:45:00Z";
      expect(calcularDuracion(inicio, fin)).toBe("45m");
    });

    it("formatea horas y minutos cuando dura una hora o más", () => {
      const inicio = "2026-01-01T10:00:00Z";
      const fin = "2026-01-01T12:30:00Z";
      expect(calcularDuracion(inicio, fin)).toBe("2h 30m");
    });
  });
});
