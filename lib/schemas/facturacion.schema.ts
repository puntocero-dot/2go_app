import { z } from "zod";

export const billingFiltersSchema = z
  .object({
    proyectoId: z
      .string({ required_error: "El proyecto es obligatorio" })
      .min(1, "El proyecto es obligatorio")
      .max(64, "ID de proyecto demasiado largo")
      .optional()
      .default("ALL"),
    desde: z
      .string({ required_error: "La fecha 'desde' es obligatoria" })
      .regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/u, "Formato de fecha 'desde' inválido (YYYY-MM-DD)")
      .optional(),
    hasta: z
      .string({ required_error: "La fecha 'hasta' es obligatoria" })
      .regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/u, "Formato de fecha 'hasta' inválido (YYYY-MM-DD)")
      .optional(),
    startDate: z
      .string()
      .regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/u, "Formato de fecha inválido (YYYY-MM-DD)")
      .optional(),
    endDate: z
      .string()
      .regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/u, "Formato de fecha inválido (YYYY-MM-DD)")
      .optional(),
  })
  .strict()
  .transform((data) => {
    // Normalizar los nombres de los campos
    return {
      proyectoId: data.proyectoId || "ALL",
      desde: data.desde || data.startDate,
      hasta: data.hasta || data.endDate,
    };
  })
  .refine((value) => {
    // Si no hay fechas, está bien (mostrar todo)
    if (!value.desde && !value.hasta) return true;
    
    // Si hay una fecha, debe haber la otra
    return value.desde && value.hasta;
  }, {
    message: "Debe proporcionar ambas fechas (inicio y fin)",
    path: ["desde"],
  })
  .superRefine((value, ctx) => {
    // Si no hay fechas, no validar
    if (!value.desde && !value.hasta) return;

    const start = new Date(`${value.desde}T00:00:00.000Z`);
    const end = new Date(`${value.hasta}T23:59:59.999Z`);

    if (Number.isNaN(start.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["desde"],
        message: "Fecha 'desde' inválida",
      });
    }

    if (Number.isNaN(end.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["hasta"],
        message: "Fecha 'hasta' inválida",
      });
    }

    if (start > end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["hasta"],
        message: "La fecha 'hasta' debe ser posterior a la fecha 'desde'",
      });
    }
  });

export type BillingFiltersInput = z.infer<typeof billingFiltersSchema>;

export function getDateRangeFromFilters(filters: BillingFiltersInput) {
  // Si no hay fechas, devolver rango por defecto (últimos 30 días)
  if (!filters.desde && !filters.hasta) {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    return { start, end };
  }

  const start = new Date(`${filters.desde}T00:00:00.000Z`);
  const end = new Date(`${filters.hasta}T23:59:59.999Z`);
  return { start, end };
}
