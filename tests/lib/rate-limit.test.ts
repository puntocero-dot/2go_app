import { describe, it, expect } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit";

const CONFIG = { windowMs: 60 * 1000, maxRequests: 5 };

describe("lib/rate-limit", () => {
  it("permite peticiones dentro del limite", async () => {
    const key = `test-allow-${Date.now()}`;
    const result = await checkRateLimit(key, CONFIG);
    expect(result.ok).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("bloquea cuando se supera el limite", async () => {
    const key = `test-block-${Date.now()}`;
    const config = { windowMs: 60 * 1000, maxRequests: 3 };

    for (let i = 0; i < 3; i++) {
      const result = await checkRateLimit(key, config);
      expect(result.ok).toBe(true);
    }

    const blocked = await checkRateLimit(key, config);
    expect(blocked.ok).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("claves distintas tienen contadores independientes", async () => {
    const ts = Date.now();
    const key1 = `test-key1-${ts}`;
    const key2 = `test-key2-${ts}`;
    const config = { windowMs: 60 * 1000, maxRequests: 2 };

    await checkRateLimit(key1, config);
    await checkRateLimit(key1, config);

    const result = await checkRateLimit(key2, config);
    expect(result.ok).toBe(true);
  });
});
