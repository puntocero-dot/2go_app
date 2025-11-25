import { z } from "zod";

// Validación de coordenadas GPS
const coordenadasSchema = z.object({
  latitud: z.number().min(-90).max(90),
  longitud: z.number().min(-180).max(180),
});

// Schema para iniciar turno
export const IniciarTurnoSchema = z.object({
  latitud: z.number().min(-90).max(90),
  longitud: z.number().min(-180).max(180),
  descripcion: z.string().max(500).optional(),
});

// Schema para guardar ubicación
export const GuardarUbicacionSchema = z.object({
  latitud: z.number().min(-90).max(90),
  longitud: z.number().min(-180).max(180),
  tipo: z.enum(["INTERMEDIO", "PARADA"]).optional().default("INTERMEDIO"),
  descripcion: z.string().max(500).optional(),
});

// Schema para finalizar turno
export const FinalizarTurnoSchema = z.object({
  latitud: z.number().min(-90).max(90),
  longitud: z.number().min(-180).max(180),
  descripcion: z.string().max(500).optional(),
});

// Types inferidos
export type IniciarTurnoInput = z.infer<typeof IniciarTurnoSchema>;
export type GuardarUbicacionInput = z.infer<typeof GuardarUbicacionSchema>;
export type FinalizarTurnoInput = z.infer<typeof FinalizarTurnoSchema>;
