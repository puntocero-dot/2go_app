import { v2 as cloudinary } from "cloudinary";

let configured = false;
let cachedCreds: { cloudName: string; apiKey: string; apiSecret: string } | null = null;

export function getCloudinary() {
  if (!configured) {
    const url = process.env.CLOUDINARY_URL;

    if (!url) {
      throw new Error(
        "Cloudinary no está configurado. Define CLOUDINARY_URL en el entorno con el formato cloudinary://API_KEY:API_SECRET@CLOUD_NAME",
      );
    }

    let cloudName: string | undefined;
    let apiKey: string | undefined;
    let apiSecret: string | undefined;

    try {
      const parsed = new URL(url);
      cloudName = parsed.hostname;
      apiKey = decodeURIComponent(parsed.username);
      apiSecret = decodeURIComponent(parsed.password);
    } catch (err) {
      console.error("No se pudo parsear CLOUDINARY_URL:", err);
    }

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error(
        "CLOUDINARY_URL no es válido. Esperado: cloudinary://API_KEY:API_SECRET@CLOUD_NAME",
      );
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    cachedCreds = { cloudName, apiKey, apiSecret };
    configured = true;
  }

  if (!cachedCreds) {
    throw new Error("Cloudinary no está configurado correctamente.");
  }

  return {
    cloudinary,
    cloudName: cachedCreds.cloudName,
    apiKey: cachedCreds.apiKey,
    apiSecret: cachedCreds.apiSecret,
  };
}
