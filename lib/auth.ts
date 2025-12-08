import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const rawSecret = process.env.JWT_SECRET;

if (!rawSecret) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET no está definido en el entorno de producción");
  } else {
    console.warn(
      "JWT_SECRET no está definido. Usando el valor por defecto solo para desarrollo. Asegúrate de definir JWT_SECRET en el entorno."
    );
  }
}

const secret = new TextEncoder().encode(
  rawSecret || "tu-secreto-super-seguro-cambialo-en-produccion"
);

export interface SessionPayload {
  userId: string;
  email: string;
  rol: "ADMIN" | "SUPERVISOR" | "ARMADOR";
}

export async function createToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT(payload as any)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
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
    maxAge: 60 * 60 * 24 * 7,
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