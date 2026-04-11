import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";

const rawSecret = process.env.JWT_SECRET;

if (!rawSecret) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET no está definido en el entorno de producción");
  } else {
    console.warn(
      "⚠️ JWT_SECRET no definido. Usando secreto aleatorio para desarrollo (las sesiones se invalidan al reiniciar)."
    );
  }
}

const devFallbackSecret = randomUUID();
const secret = new TextEncoder().encode(rawSecret || devFallbackSecret);

export interface SessionPayload {
  userId: string;
  email: string;
  rol: "ADMIN" | "SUPERVISOR" | "ARMADOR";
}

export async function createToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("4h")
    .sign(secret);
}

export async function verifyToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify<SessionPayload>(token, secret);
    return payload;
  } catch {
    return null;
  }
}

/**
 * Verifica el token y retorna si esta proximo a expirar (dentro de 1 hora).
 * Usado por el middleware para auto-refresh.
 */
export async function verifyTokenWithExpiry(
  token: string
): Promise<{ session: SessionPayload | null; shouldRefresh: boolean }> {
  try {
    const { payload } = await jwtVerify<SessionPayload>(token, secret);
    const exp = payload.exp ?? 0;
    const now = Math.floor(Date.now() / 1000);
    const shouldRefresh = exp - now < 3600; // menos de 1 hora restante
    return { session: payload, shouldRefresh };
  } catch {
    return { session: null, shouldRefresh: false };
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  return await verifyToken(token);
}

export async function createSession(payload: SessionPayload) {
  const token = await createToken(payload);
  const cookieStore = await cookies();

  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 4, // 4 horas
    path: "/",
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

export async function hashPassword(password: string): Promise<string> {
  const mod = await import("bcryptjs");
  const bcrypt = (mod as any).default || mod;
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  const mod = await import("bcryptjs");
  const bcrypt = (mod as any).default || mod;
  return await bcrypt.compare(password, hashedPassword);
}