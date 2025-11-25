import { z } from "zod";

// Schema para actualizar perfil
export const ActualizarPerfilSchema = z.object({
  nombre: z.string().min(2).max(100).optional(),
  telefono: z.string().regex(/^\+?[0-9\s\-()]+$/).max(20).optional(),
  fotoPerfil: z.string().url().max(500).optional().or(z.literal("")),
  passwordActual: z.string().min(6).optional(),
  password: z.string().min(6).optional(),
  passwordConfirm: z.string().min(6).optional(),
}).refine(
  (data) => {
    // Si se proporciona password, debe haber passwordActual y passwordConfirm
    if (data.password) {
      return data.passwordActual && data.passwordConfirm && data.password === data.passwordConfirm;
    }
    return true;
  },
  {
    message: "Password confirmation must match and current password is required",
    path: ["passwordConfirm"],
  }
);

// Schema para cambiar estado de loggeo
export const CambiarEstadoLoggeoSchema = z.object({
  estadoLoggeo: z.enum(["ACTIVO", "LUNCH", "BREAK", "OFFLINE"]),
});

// Types inferidos
export type ActualizarPerfilInput = z.infer<typeof ActualizarPerfilSchema>;
export type CambiarEstadoLoggeoInput = z.infer<typeof CambiarEstadoLoggeoSchema>;
