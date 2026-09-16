import { prisma } from "./prisma";

const CLAVE_LOGIN_BACKGROUND = "LOGIN_BACKGROUND";
const DEFAULT_LOGIN_BACKGROUND_URL = "/bg-login.jpg";

export async function getLoginBackgroundUrl(): Promise<string> {
  try {
    const record = await prisma.configuracionSistema.findUnique({
      where: { clave: CLAVE_LOGIN_BACKGROUND },
    });

    const value = record?.valor as { url?: string } | null;
    return value?.url || DEFAULT_LOGIN_BACKGROUND_URL;
  } catch (error) {
    console.error("Error loading login background config, using default:", error);
    return DEFAULT_LOGIN_BACKGROUND_URL;
  }
}

export async function updateLoginBackgroundUrl(url: string): Promise<void> {
  await prisma.configuracionSistema.upsert({
    where: { clave: CLAVE_LOGIN_BACKGROUND },
    update: { valor: { url } },
    create: {
      clave: CLAVE_LOGIN_BACKGROUND,
      valor: { url },
      descripcion: "Imagen de fondo de la pantalla de login",
    },
  });
}
