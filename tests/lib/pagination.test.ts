import { describe, it, expect } from "vitest";
import { getPaginationParams, buildPaginatedResponse } from "@/lib/pagination";

describe("lib/pagination", () => {
  describe("getPaginationParams", () => {
    it("usa defaults cuando no se pasan params", () => {
      const params = getPaginationParams(new URLSearchParams());
      expect(params.page).toBe(1);
      expect(params.limit).toBe(50);
      expect(params.skip).toBe(0);
    });

    it("parsea page y limit correctamente", () => {
      const params = getPaginationParams(new URLSearchParams("page=3&limit=20"));
      expect(params.page).toBe(3);
      expect(params.limit).toBe(20);
      expect(params.skip).toBe(40); // (3-1) * 20
    });

    it("clampea limit al maximo de 100", () => {
      const params = getPaginationParams(new URLSearchParams("limit=500"));
      expect(params.limit).toBe(100);
    });

    it("no permite page menor a 1", () => {
      const params = getPaginationParams(new URLSearchParams("page=0"));
      expect(params.page).toBe(1);
    });

    it("no permite page negativa", () => {
      const params = getPaginationParams(new URLSearchParams("page=-5"));
      expect(params.page).toBe(1);
    });
  });

  describe("buildPaginatedResponse", () => {
    const pagination = { page: 1, limit: 10, skip: 0 };

    it("construye el envelope correcto", () => {
      const data = [1, 2, 3];
      const result = buildPaginatedResponse(data, 25, pagination);
      expect(result.data).toEqual(data);
      expect(result.total).toBe(25);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(3);
      expect(result.hasMore).toBe(true);
    });

    it("hasMore es false en la ultima pagina", () => {
      const result = buildPaginatedResponse([1, 2], 2, { page: 1, limit: 10, skip: 0 });
      expect(result.hasMore).toBe(false);
    });

    it("maneja listas vacias correctamente", () => {
      const result = buildPaginatedResponse([], 0, pagination);
      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
      expect(result.hasMore).toBe(false);
    });
  });
});
