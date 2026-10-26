import { z } from "zod";
import { zodSanitizeText } from "../sanitize";

const TipoPrincipalSchema = z.enum(["COBRO_FIJO_UNITARIO", "COBRO_POR_VOLUMEN"]);

const RangoVolumenSchema = z.object({
  desde: z.number().nonnegative(),
  hasta: z.number().nonnegative(),
  precio: z.number().nonnegative(),
});

const CobroDistanciaSchema = z.object({
  municipio: z.string().min(1).max(200).transform(zodSanitizeText),
  precio: z.number().nonnegative(),
});

const PenalizacionSchema = z.object({
  tipo: z.string().min(1).max(200).transform(zodSanitizeText),
  precio: z.number().nonnegative().optional(),
  monto: z.number().nonnegative().optional(),
});

export const ReglaCobroSchema = z.object({
  tipoPrincipal: TipoPrincipalSchema,
  precioFijoUnitario: z.number().nonnegative().optional(),
  // Límites defensivos (GHSA-mrhx-c7xc-m3w5) contra payloads de tamaño
  // no realista — ninguna regla de cobro real necesita cientos de tramos.
  rangosVolumen: z.array(RangoVolumenSchema).max(50).optional(),
  precioVIP: z.number().nonnegative().optional(),
  precioUrgente: z.number().nonnegative().optional(),
  precioMedia: z.number().nonnegative().optional(),
  precioNormal: z.number().nonnegative().optional(),
  precioGrande: z.number().nonnegative().optional(),
  precioMediano: z.number().nonnegative().optional(),
  precioPequeno: z.number().nonnegative().optional(),
  cobrosDistancia: z.array(CobroDistanciaSchema).max(300).optional(),
  penalizaciones: z.array(PenalizacionSchema).max(100).optional(),
});

export type ReglaCobroInput = z.infer<typeof ReglaCobroSchema>;
