import { describe, it, expect } from "vitest";
import { createToken, verifyToken, verifyTokenWithExpiry } from "@/lib/auth";

const testPayload = {
  userId: "user-123",
  email: "test@example.com",
  rol: "ADMIN" as const,
};

describe("lib/auth", () => {
  describe("createToken", () => {
    it("crea un token JWT valido", async () => {
      const token = await createToken(testPayload);
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3); // formato JWT
    });
  });

  describe("verifyToken", () => {
    it("verifica un token valido y retorna el payload", async () => {
      const token = await createToken(testPayload);
      const result = await verifyToken(token);
      expect(result).not.toBeNull();
      expect(result?.userId).toBe(testPayload.userId);
      expect(result?.email).toBe(testPayload.email);
      expect(result?.rol).toBe(testPayload.rol);
    });

    it("retorna null para un token invalido", async () => {
      const result = await verifyToken("token.invalido.fake");
      expect(result).toBeNull();
    });

    it("retorna null para un token vacio", async () => {
      const result = await verifyToken("");
      expect(result).toBeNull();
    });
  });

  describe("verifyTokenWithExpiry", () => {
    it("indica shouldRefresh=false para tokens recien creados", async () => {
      const token = await createToken(testPayload);
      const { session, shouldRefresh } = await verifyTokenWithExpiry(token);
      expect(session).not.toBeNull();
      expect(shouldRefresh).toBe(false);
    });

    it("retorna session=null para tokens invalidos", async () => {
      const { session, shouldRefresh } = await verifyTokenWithExpiry("bad.token.here");
      expect(session).toBeNull();
      expect(shouldRefresh).toBe(false);
    });
  });
});
