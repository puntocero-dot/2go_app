import { z } from "zod";
import { zodSanitizeText, zodSanitizeEmail, zodSanitizePhone } from "@/lib/sanitize";

export const prioridadesPermitidas = ["VIP", "URGENTE", "MEDIA", "NORMAL"] as const;

// Schema para CREAR cliente (POST)
export const crearClienteSchema = z.object({
  nombre: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .trim()
    .transform(zodSanitizeText),

  telefono: z
    .string()
    .min(7, "El teléfono debe tener al menos 7 caracteres")
    .max(20, "El teléfono no puede exceder 20 caracteres")
    .transform(zodSanitizePhone),

  email: z
    .string()
    .email("Email inválido")
    .max(254, "El email no puede exceder 254 caracteres")
    .transform(zodSanitizeEmail)
    .optional()
    .or(z.literal("")),

  direccionCompleta: z
    .string()
    .min(5, "La dirección debe tener al menos 5 caracteres")
    .max(500, "La dirección no puede exceder 500 caracteres")
    .trim()
    .transform(zodSanitizeText),

  municipio: z
    .string()
    .min(2, "El municipio debe tener al menos 2 caracteres")
    .max(100, "El municipio no puede exceder 100 caracteres")
    .trim()
    .transform(zodSanitizeText),

  departamento: z
    .string()
    .min(2, "El departamento debe tener al menos 2 caracteres")
    .max(100, "El departamento no puede exceder 100 caracteres")
    .trim()
    .transform(zodSanitizeText),

  proyectoId: z
    .string()
    .min(1, "El proyecto es requerido")
    .max(100, "ID de proyecto inválido"),

  prioridad: z
    .enum(prioridadesPermitidas, {
      errorMap: () => ({ message: "Prioridad inválida" }),
    })
    .optional()
    .default("NORMAL"),
});

export type CrearClienteInput = z.infer<typeof crearClienteSchema>;
