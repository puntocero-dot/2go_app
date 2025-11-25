import { z } from "zod";

// Schema para configuración de facturación
export const ConfiguracionFacturacionSchema = z.object({
  nombreEmpresa: z.string().min(2).max(200).optional(),
  giro: z.string().max(200).optional(),
  direccion: z.string().min(5).max(500).optional(),
  telefono: z.string().regex(/^\+?[0-9\s\-()]+$/).max(20).optional(),
  email: z.string().email().max(100).optional(),
  logoUrl: z.string().url().max(500).optional().or(z.literal("")),
  colorPrimario: z.string().max(20).optional(),
  colorAccent: z.string().max(20).optional(),
  terminosCondiciones: z.string().max(5000).optional(),
  notasPiePagina: z.string().max(1000).optional(),
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
