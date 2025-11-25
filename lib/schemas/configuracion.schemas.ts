import { z } from "zod";
import { zodSanitizeText, zodSanitizePhone, zodSanitizeEmail, zodSanitizeURL, zodSanitizeHTML } from "../sanitize";

// Schema para configuración de facturación
export const ConfiguracionFacturacionSchema = z.object({
  nombreEmpresa: z.string().min(2).max(200).transform(zodSanitizeText).optional(),
  giro: z.string().max(200).transform(zodSanitizeText).optional(),
  direccion: z.string().min(5).max(500).transform(zodSanitizeText).optional(),
  telefono: z.string().regex(/^\+?[0-9\s\-()]+$/).max(20).transform(zodSanitizePhone).optional(),
  email: z.string().email().max(100).transform(zodSanitizeEmail).optional(),
  logoUrl: z.string().url().max(500).transform(zodSanitizeURL).optional().or(z.literal("")),
  colorPrimario: z.string().max(20).transform(zodSanitizeText).optional(),
  colorAccent: z.string().max(20).transform(zodSanitizeText).optional(),
  terminosCondiciones: z.string().max(5000).transform(zodSanitizeHTML).optional(),
  notasPiePagina: z.string().max(1000).transform(zodSanitizeHTML).optional(),
});

// Schema para configuración general
export const ConfiguracionGeneralSchema = z.object({
  nombreApp: z.string().min(2).max(100).optional(),
  descripcion: z.string().max(500).optional(),
  emailSoporte: z.string().email().max(100).optional(),
  telefonoSoporte: z.string().regex(/^\+?[0-9\s\-()]+$/).max(20).optional(),
  horariosAtencion: z.string().max(200).optional(),
  mensajeBienvenida: z.string().max(500).optional(),
});

// Types inferidos
export type ConfiguracionFacturacionInput = z.infer<typeof ConfiguracionFacturacionSchema>;
export type ConfiguracionGeneralInput = z.infer<typeof ConfiguracionGeneralSchema>;
