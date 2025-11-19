import { z } from "zod";

export const billingFiltersSchema = z
  .object({
    proyectoId: z
      .string({ required_error: "El proyecto es obligatorio" })
      .min(1, "El proyecto es obligatorio")
      .max(64, "ID de proyecto demasiado largo"),
    desde: z
      .string({ required_error: "La fecha 'desde' es obligatoria" })
      .regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/u, "Formato de fecha 'desde' inválido (YYYY-MM-DD)"),
    hasta: z
      .string({ required_error: "La fecha 'hasta' es obligatoria" })
      .regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/u, "Formato de fecha 'hasta' inválido (YYYY-MM-DD)"),
  })
  .strict()
  .superRefine((value, ctx) => {
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

    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && start > end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["hasta"],
        message: "La fecha 'hasta' debe ser posterior o igual a 'desde'",
      });
    }
  });

export type BillingFiltersInput = z.infer<typeof billingFiltersSchema>;

export function getDateRangeFromFilters(filters: BillingFiltersInput) {
  const start = new Date(`${filters.desde}T00:00:00.000Z`);
  const end = new Date(`${filters.hasta}T23:59:59.999Z`);
  return { start, end };
}
