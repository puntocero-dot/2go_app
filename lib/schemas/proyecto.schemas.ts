import { z } from "zod";
import {
  zodSanitizeText,
  zodSanitizeEmail,
  zodSanitizePhone,
} from "../sanitize";

const TipoClienteSchema = z.enum(["CREDITO_FISCAL", "CONSUMIDOR_FINAL"]);

// Límite defensivo (GHSA-mrhx-c7xc-m3w5): z.record(z.any()) no tiene techo
// de tamaño propio en Zod v3 — sin esto, un payload con miles de claves o
// valores profundamente anidados puede agotar memoria validándolo.
const datosFacturacionSchema = z
  .record(z.any())
  .refine((val) => Object.keys(val).length <= 50, {
    message: "datosFacturacion no puede tener más de 50 campos",
  })
  .refine((val) => JSON.stringify(val).length <= 20_000, {
    message: "datosFacturacion es demasiado grande",
  });

export const CrearProyectoSchema = z.object({
  nombreComercial: z.string().min(2).max(200).transform(zodSanitizeText),
  tipoCliente: TipoClienteSchema,
  datosFacturacion: datosFacturacionSchema,
});

export const ActualizarProyectoSchema = z.object({
  nombreComercial: z.string().min(2).max(200).transform(zodSanitizeText).optional(),
  tipoCliente: TipoClienteSchema.optional(),
  datosFacturacion: datosFacturacionSchema.optional(),
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
