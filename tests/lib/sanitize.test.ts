import { describe, it, expect } from "vitest";
import {
  sanitizeText,
  sanitizeObject,
  escapeSQLString,
  sanitizeEmail,
  sanitizePhone,
  sanitizeURL,
  sanitizeFileName,
} from "@/lib/sanitize";

describe("lib/sanitize", () => {
  describe("sanitizeText", () => {
    it("elimina etiquetas HTML", () => {
      expect(sanitizeText("<script>alert(1)</script>hola")).toBe("alert(1)hola");
    });

    it("elimina caracteres de control", () => {
      expect(sanitizeText("hola\u0000mundo")).toBe("holamundo");
    });

    it("hace trim", () => {
      expect(sanitizeText("  hola  ")).toBe("hola");
    });

    it("maneja null/undefined/vacio sin lanzar", () => {
      expect(sanitizeText(null)).toBe("");
      expect(sanitizeText(undefined)).toBe("");
      expect(sanitizeText("")).toBe("");
    });

    it("no deja pasar un payload XSS clasico de atributo", () => {
      const payload = '<img src=x onerror="alert(1)">';
      const result = sanitizeText(payload);
      expect(result).not.toContain("<img");
      expect(result).not.toContain("onerror=");
    });
  });

  describe("sanitizeObject", () => {
    it("sanitiza strings anidados recursivamente", () => {
      const result = sanitizeObject({
        nombre: "<b>Juan</b>",
        direccion: { calle: "<i>Principal</i>" },
      });
      expect(result.nombre).toBe("Juan");
      expect(result.direccion.calle).toBe("Principal");
    });

    it("sanitiza strings dentro de arrays", () => {
      const result = sanitizeObject({ tags: ["<b>a</b>", "<i>b</i>"] });
      expect(result.tags).toEqual(["a", "b"]);
    });

    it("no toca excludeKeys", () => {
      const result = sanitizeObject(
        { password: "<raw>", nombre: "<b>Juan</b>" },
        { excludeKeys: ["password"] }
      );
      expect(result.password).toBe("<raw>");
      expect(result.nombre).toBe("Juan");
    });

    it("no sanitiza numeros ni booleanos", () => {
      const result = sanitizeObject({ edad: 30, activo: true, nota: null });
      expect(result.edad).toBe(30);
      expect(result.activo).toBe(true);
      expect(result.nota).toBe(null);
    });
  });

  describe("escapeSQLString", () => {
    it("escapa comillas simples y dobles", () => {
      expect(escapeSQLString(`O'Brien "test"`)).toBe(`O\\'Brien \\"test\\"`);
    });

    it("maneja null/undefined", () => {
      expect(escapeSQLString(null)).toBe("");
      expect(escapeSQLString(undefined)).toBe("");
    });
  });

  describe("sanitizeEmail", () => {
    it("acepta y normaliza un email valido", () => {
      expect(sanitizeEmail("  Admin@Example.com  ")).toBe("admin@example.com");
    });

    it("rechaza un email con formato invalido", () => {
      expect(sanitizeEmail("no-es-un-email")).toBe("");
    });

    it("maneja null/undefined", () => {
      expect(sanitizeEmail(null)).toBe("");
    });
  });

  describe("sanitizePhone", () => {
    it("conserva digitos, +, -, parentesis y espacios", () => {
      expect(sanitizePhone("+503 7777-8888")).toBe("+503 7777-8888");
    });

    it("elimina letras e inyeccion de etiquetas", () => {
      expect(sanitizePhone("<script>7777</script>")).toBe("7777");
    });
  });

  describe("sanitizeURL", () => {
    it("acepta una URL https valida", () => {
      expect(sanitizeURL("https://example.com/path")).toBe("https://example.com/path");
    });

    it("rechaza protocolo javascript: (XSS)", () => {
      expect(sanitizeURL("javascript:alert(1)")).toBe("");
    });

    it("rechaza una cadena que no es URL", () => {
      expect(sanitizeURL("no es una url")).toBe("");
    });
  });

  describe("sanitizeFileName", () => {
    it("reemplaza caracteres peligrosos por guion bajo", () => {
      expect(sanitizeFileName("archivo con espacios!.pdf")).toBe("archivo_con_espacios_.pdf");
    });

    it("previene path traversal colapsando puntos repetidos", () => {
      const result = sanitizeFileName("../../etc/passwd");
      expect(result).not.toContain("..");
    });

    it("limita la longitud a 255 caracteres", () => {
      const result = sanitizeFileName("a".repeat(300) + ".txt");
      expect(result.length).toBeLessThanOrEqual(255);
    });
  });
});
