import { z } from "zod";
import {
  zodSanitizeText,
  zodSanitizeEmail,
  zodSanitizePhone,
} from "../sanitize";

const TipoClienteSchema = z.enum(["CREDITO_FISCAL", "CONSUMIDOR_FINAL"]);

export const CrearProyectoSchema = z.object({
  nombreComercial: z.string().min(2).max(200).transform(zodSanitizeText),
  tipoCliente: TipoClienteSchema,
  datosFacturacion: z.record(z.any()),
});

export const ActualizarProyectoSchema = z.object({
  nombreComercial: z.string().min(2).max(200).transform(zodSanitizeText).optional(),
  tipoCliente: TipoClienteSchema.optional(),
  datosFacturacion: z.record(z.any()).optional(),
  activo: z.boolean().optional(),
  estado: z.string().max(50).transform(zodSanitizeText).optional(),
  descripcion: z.string().max(1000).transform(zodSanitizeText).optional(),
  contactoEmail: z
    .string()
    .email()
    .max(100)
    .transform(zodSanitizeEmail)
    .optional(),
  contactoTelefono: z
    .string()
    .max(20)
    .transform(zodSanitizePhone)
    .optional(),
  direccion: z.string().max(500).transform(zodSanitizeText).optional(),
  reglaCobro: z.any().optional(),
});

export type CrearProyectoInput = z.infer<typeof CrearProyectoSchema>;
export type ActualizarProyectoInput = z.infer<typeof ActualizarProyectoSchema>;
