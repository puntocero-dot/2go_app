import { z } from "zod";

export const rolesPermitidos = ["ADMIN", "SUPERVISOR", "ARMADOR", "OBSERVADOR"] as const;

export const estadosArmadorPermitidos = [
  "ACTIVO",
  "INACTIVO",
  "VACACIONES",
] as const;

const telefonoBaseSchema = z
  .string()
  .max(20, "El teléfono no puede exceder 20 caracteres")
  .regex(/^[+0-9\s()-]*$/, "Formato de teléfono inválido");

const habilidadesTextoSchema = z
  .string()
  .max(500, "Las habilidades no pueden exceder 500 caracteres")
  .trim();

// Schema para CREAR usuario (POST)
export const crearUsuarioSchema = z.object({
  nombre: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .trim(),

  email: z
    .string()
    .email("Email inválido")
    .max(254, "El email no puede exceder 254 caracteres")
    .toLowerCase()
    .trim(),

  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(100, "La contraseña no puede exceder 100 caracteres")
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
    .regex(/[a-z]/, "Debe contener al menos una minúscula")
    .regex(/[0-9]/, "Debe contener al menos un número")
    .regex(/[^A-Za-z0-9]/, "Debe contener al menos un carácter especial"),

  telefono: telefonoBaseSchema.optional().or(z.literal("")),

  rol: z.enum(rolesPermitidos, {
    errorMap: () => ({ message: "Rol inválido" }),
  }),

  estadoArmador: z.enum(estadosArmadorPermitidos).optional(),

  habilidades: z
    .union([
      habilidadesTextoSchema,
      z.literal(""),
      z.array(habilidadesTextoSchema),
    ])
    .optional(),
});

// Schema para ACTUALIZAR usuario (PATCH)
export const actualizarUsuarioSchema = z
  .object({
    nombre: z
      .string()
      .min(2, "El nombre debe tener al menos 2 caracteres")
      .max(100, "El nombre no puede exceder 100 caracteres")
      .trim()
      .optional(),

    email: z
      .string()
      .email("Email inválido")
      .max(254, "El email no puede exceder 254 caracteres")
      .toLowerCase()
      .trim()
      .optional(),

    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .max(100, "La contraseña no puede exceder 100 caracteres")
      .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
      .regex(/[a-z]/, "Debe contener al menos una minúscula")
      .regex(/[0-9]/, "Debe contener al menos un número")
      .regex(/[^A-Za-z0-9]/, "Debe contener al menos un carácter especial")
      .optional(),

    telefono: telefonoBaseSchema.optional().or(z.literal("")).or(z.null()),

    rol: z
      .enum(rolesPermitidos, {
        errorMap: () => ({ message: "Rol inválido" }),
      })
      .optional(),

    activo: z.boolean().optional(),

    estadoArmador: z.enum(estadosArmadorPermitidos).optional(),

    habilidades: z
      .union([
        habilidadesTextoSchema,
        z.literal(""),
        z.array(habilidadesTextoSchema),
      ])
      .optional(),

    proyectosIds: z.array(z.string().min(1)).optional(),
  })
  .strict();

export type CrearUsuarioInput = z.infer<typeof crearUsuarioSchema>;
export type ActualizarUsuarioInput = z.infer<typeof actualizarUsuarioSchema>;
