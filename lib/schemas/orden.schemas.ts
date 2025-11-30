import { z } from "zod";
import { zodSanitizeText } from "../sanitize";

// Schema para crear orden (sistema de armado de muebles)
export const CrearOrdenSchema = z.object({
  codigoReferenciaRetail: z.string().min(1).max(100).transform(zodSanitizeText),
  muebleId: z.string().uuid(),
  usuarioFinalId: z.string().uuid(),
  proyectoId: z.string().uuid(),
  fechaSolicitadaCliente: z.string().datetime().optional().or(z.literal("")),
  autoAsignar: z.boolean().optional().default(false),
  prioridad: z.enum(["VIP", "URGENTE", "MEDIA", "NORMAL"]).optional().default("NORMAL"),
});

// Schema para actualizar orden
export const ActualizarOrdenSchema = z.object({
  clienteNombre: z.string().min(2).max(200).transform(zodSanitizeText).optional(),
  clienteTelefono: z.string().regex(/^\+?[0-9\s\-()]+$/).max(20).optional(),
  clienteDireccion: z.string().min(5).max(500).transform(zodSanitizeText).optional(),
  descripcion: z.string().max(1000).transform(zodSanitizeText).optional(),
  prioridad: z.enum(["BAJA", "MEDIA", "ALTA", "URGENTE"]).optional(),
  notas: z.string().max(1000).transform(zodSanitizeText).optional(),
  estado: z.enum(["PENDIENTE", "EN_PROCESO", "COMPLETADA", "CANCELADA"]).optional(),
});

// Schema para asignar armador
export const AsignarArmadorSchema = z.object({
  armadorId: z.string().uuid(),
});

// Schema para cambiar estado
export const CambiarEstadoOrdenSchema = z.object({
  estado: z.enum(["PENDIENTE", "EN_PROCESO", "COMPLETADA", "CANCELADA"]),
  notas: z.string().max(1000).optional(),
});

// Schema para actualización de orden en API (/api/ordenes/[id])
export const ActualizarOrdenApiSchema = z
  .object({
    estado: z
      .enum([
        "SIN_ASIGNAR",
        "ASIGNADO",
        "EN_RUTA",
        "ARMADO_INICIADO",
        "ARMADO_FINALIZADO",
        "ARMADO_COMPLETADO",
        "CANCELADA",
      ])
      .optional(),
    armadorId: z.string().min(1).optional().nullable(),
    comentario: z.string().max(1000).transform(zodSanitizeText).optional(),
    autoAssignMeta: z
      .object({
        etaEstimadoMin: z.number().int().min(0).optional(),
      })
      .partial()
      .optional(),
    gps: z
      .object({
        latitud: z.number().optional(),
        longitud: z.number().optional(),
      })
      .optional(),
    receptor: z
      .object({
        nombre: z.string().max(200).transform(zodSanitizeText).optional(),
        documento: z.string().max(200).transform(zodSanitizeText).optional(),
      })
      .optional(),
    csat: z
      .object({
        puntaje: z.union([z.number(), z.string()]).optional(),
        comentario: z.string().max(1000).transform(zodSanitizeText).optional(),
      })
      .optional(),
  })
  .passthrough();

export const AutoAsignarOrdenesSchema = z.object({
  ordenIds: z.array(z.string().min(1)).nonempty(),
});

export const RegistrarArchivosOrdenSchema = z.object({
  archivos: z
    .array(
      z.object({
        url: z.string().min(1),
        tipo: z.enum(["FOTO", "VIDEO"]),
      })
    )
    .nonempty(),
});

export const SignArchivoOrdenSchema = z.object({
  tipo: z.enum(["FOTO", "VIDEO"]),
  contentType: z.string().max(200).optional().nullable(),
  size: z.number().int().min(0).max(25 * 1024 * 1024).optional(),
});

// Types inferidos
export type CrearOrdenInput = z.infer<typeof CrearOrdenSchema>;
export type ActualizarOrdenInput = z.infer<typeof ActualizarOrdenSchema>;
export type AsignarArmadorInput = z.infer<typeof AsignarArmadorSchema>;
export type CambiarEstadoOrdenInput = z.infer<typeof CambiarEstadoOrdenSchema>;
export type ActualizarOrdenApiInput = z.infer<typeof ActualizarOrdenApiSchema>;
export type AutoAsignarOrdenesInput = z.infer<typeof AutoAsignarOrdenesSchema>;
export type RegistrarArchivosOrdenInput = z.infer<
  typeof RegistrarArchivosOrdenSchema
>;
export type SignArchivoOrdenInput = z.infer<typeof SignArchivoOrdenSchema>;
