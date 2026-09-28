import { z } from "zod";

export const ActualizarEstadoLeadSchema = z.object({
  estadoLead: z.enum(["NUEVO", "CONTACTADO", "CALIFICADO", "CONVERTIDO", "DESCARTADO"]),
});

export type ActualizarEstadoLeadInput = z.infer<typeof ActualizarEstadoLeadSchema>;
