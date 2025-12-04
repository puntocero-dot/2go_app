import { z } from "zod";
import { zodSanitizeText } from "../sanitize";

const DateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .transform((v) => v.trim());

export const ReporteBIFiltrosSchema = z.object({
  proyectoId: z
    .string()
    .max(100)
    .transform(zodSanitizeText)
    .optional(),
  fechaInicio: DateStringSchema.optional(),
  fechaFin: DateStringSchema.optional(),
  format: z.enum(["csv", "pdf"]).optional(),
});

const EstadoOrdenSchema = z.enum([
  "SIN_ASIGNAR",
  "ASIGNADO",
  "EN_RUTA",
  "ARMADO_INICIADO",
  "ARMADO_FINALIZADO",
  "ARMADO_COMPLETADO",
  "CANCELADA",
]);

export const ReporteTiemposPedidoFiltrosSchema = z.object({
  desde: DateStringSchema.optional(),
  hasta: DateStringSchema.optional(),
  proyectoId: z
    .string()
    .max(100)
    .transform(zodSanitizeText)
    .optional(),
  estado: EstadoOrdenSchema.optional(),
  armadorId: z
    .string()
    .max(100)
    .transform(zodSanitizeText)
    .optional(),
});
