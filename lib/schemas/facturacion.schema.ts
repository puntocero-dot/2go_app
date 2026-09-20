import { z } from "zod";

// Los inputs <input type="date"> de un <form method="get"> envían un string
// vacío (no omiten el parámetro) cuando el usuario no eligió fecha. Sin este
// preprocesamiento, "" no matchea el regex y Zod lanza un error sin manejar
// que tumba toda la página de facturación con la pantalla de error genérica.
const emptyToUndefined = (val: unknown) =>
  typeof val === "string" && val.trim() === "" ? undefined : val;

const optionalDateString = (message: string) =>
  z.preprocess(
    emptyToUndefined,
    z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/u, message).optional()
  );

export const billingFiltersSchema = z
  .object({
    proyectoId: z.preprocess(
      emptyToUndefined,
      z
        .string()
        .min(1, "El proyecto es obligatorio")
        .max(64, "ID de proyecto demasiado largo")
        .optional()
        .default("ALL")
    ),
    desde: optionalDateString("Formato de fecha 'desde' inválido (YYYY-MM-DD)"),
    hasta: optionalDateString("Formato de fecha 'hasta' inválido (YYYY-MM-DD)"),
    startDate: optionalDateString("Formato de fecha inválido (YYYY-MM-DD)"),
    endDate: optionalDateString("Formato de fecha inválido (YYYY-MM-DD)"),
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
