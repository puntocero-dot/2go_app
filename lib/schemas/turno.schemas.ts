import { z } from "zod";
import { zodSanitizeText } from "../sanitize";

// Validación de coordenadas GPS
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const coordenadasSchema = z.object({
  latitud: z.number().min(-90).max(90),
  longitud: z.number().min(-180).max(180),
});

// Schema para iniciar turno
export const IniciarTurnoSchema = z.object({
  latitud: z.number().min(-90).max(90),
  longitud: z.number().min(-180).max(180),
  descripcion: z.string().max(500).transform(zodSanitizeText).optional(),
});

// Schema para guardar ubicación
export const GuardarUbicacionSchema = z.object({
  latitud: z.number().min(-90).max(90),
  longitud: z.number().min(-180).max(180),
  tipo: z.enum(["INTERMEDIO", "PARADA"]).optional().default("INTERMEDIO"),
  descripcion: z.string().max(500).transform(zodSanitizeText).optional(),
});

// Schema para finalizar turno
export const FinalizarTurnoSchema = z.object({
  latitud: z.number().min(-90).max(90),
  longitud: z.number().min(-180).max(180),
  descripcion: z.string().max(500).transform(zodSanitizeText).optional(),
});

// Types inferidos
export type IniciarTurnoInput = z.infer<typeof IniciarTurnoSchema>;
export type GuardarUbicacionInput = z.infer<typeof GuardarUbicacionSchema>;
export type FinalizarTurnoInput = z.infer<typeof FinalizarTurnoSchema>;
