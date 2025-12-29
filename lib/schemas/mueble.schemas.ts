import { z } from "zod";
import { zodSanitizeText } from "@/lib/sanitize";

export const tamanosPermitidos = ["GRANDE", "MEDIANO", "PEQUENO"] as const;

// Schema para CREAR mueble (POST)
export const crearMuebleSchema = z.object({
  nombre: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .trim()
    .transform(zodSanitizeText),

  tamano: z.enum(tamanosPermitidos, {
    errorMap: () => ({ message: "Tamaño inválido. Debe ser GRANDE, MEDIANO o PEQUENO" }),
  }),

  descripcion: z
    .string()
    .max(500, "La descripción no puede exceder 500 caracteres")
    .trim()
    .transform(zodSanitizeText)
    .optional()
    .or(z.literal("")),

  proyectoId: z
    .string()
    .min(1, "El proyecto es requerido")
    .max(100, "ID de proyecto inválido"),
});

export type CrearMuebleInput = z.infer<typeof crearMuebleSchema>;
