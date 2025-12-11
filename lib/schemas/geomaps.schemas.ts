import { z } from "zod";

export const ConfiguracionGeomapsSchema = z.object({
  duracionMinimaParada: z
    .number()
    .int()
    .min(1, "Debe ser al menos 1 minuto")
    .max(60, "No puede exceder 60 minutos")
    .default(5),
  radioParada: z
    .number()
    .int()
    .min(10, "Debe ser al menos 10 metros")
    .max(500, "No puede exceder 500 metros")
    .default(50),
  umbralVelocidadExcesiva: z
    .number()
    .int()
    .min(40, "Debe ser al menos 40 km/h")
    .max(150, "No puede exceder 150 km/h")
    .default(80),
  radioProximidadCliente: z
    .number()
    .int()
    .min(20, "Debe ser al menos 20 metros")
    .max(500, "No puede exceder 500 metros")
    .default(100),
  intervaloActualizacionGPS: z
    .number()
    .int()
    .min(1, "Debe ser al menos 1 minuto")
    .max(30, "No puede exceder 30 minutos")
    .default(2),
});

export type ConfiguracionGeomapsInput = z.infer<typeof ConfiguracionGeomapsSchema>;
