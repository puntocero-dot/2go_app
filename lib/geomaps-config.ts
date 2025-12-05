import { prisma } from "./prisma";

export type GeomapsConfig = {
  stopDurationMin: number;
  stopRadiusMeters: number;
  speedingKmh: number;
  clienteRadiusMeters: number;
};

const DEFAULT_GEOMAPS_CONFIG: GeomapsConfig = {
  stopDurationMin: 10,
  stopRadiusMeters: 50,
  speedingKmh: 80,
  clienteRadiusMeters: 200,
};

export async function getGeomapsConfig(): Promise<GeomapsConfig> {
  try {
    const record = await prisma.configuracionSistema.findUnique({
      where: { clave: "GEOMAPS_RULES" },
    });

    if (!record) return DEFAULT_GEOMAPS_CONFIG;

    const value = record.valor as Partial<GeomapsConfig> | null;

    return {
      stopDurationMin: value?.stopDurationMin ?? DEFAULT_GEOMAPS_CONFIG.stopDurationMin,
      stopRadiusMeters: value?.stopRadiusMeters ?? DEFAULT_GEOMAPS_CONFIG.stopRadiusMeters,
      speedingKmh: value?.speedingKmh ?? DEFAULT_GEOMAPS_CONFIG.speedingKmh,
      clienteRadiusMeters: value?.clienteRadiusMeters ?? DEFAULT_GEOMAPS_CONFIG.clienteRadiusMeters,
    };
  } catch (error) {
    console.error("Error loading Geomaps config, using defaults:", error);
    return DEFAULT_GEOMAPS_CONFIG;
  }
}

export async function updateGeomapsConfig(input: GeomapsConfig): Promise<void> {
  await prisma.configuracionSistema.upsert({
    where: { clave: "GEOMAPS_RULES" },
    update: { valor: input },
    create: {
      clave: "GEOMAPS_RULES",
      valor: input,
      descripcion: "Reglas de tracking y análisis de ruta para Geomaps",
    },
  });
}
