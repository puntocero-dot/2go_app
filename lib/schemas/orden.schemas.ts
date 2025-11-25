import { z } from "zod";

// Schema para crear orden (sistema de armado de muebles)
export const CrearOrdenSchema = z.object({
  codigoReferenciaRetail: z.string().min(1).max(100),
  muebleId: z.string().uuid(),
  usuarioFinalId: z.string().uuid(),
  proyectoId: z.string().uuid(),
  fechaSolicitadaCliente: z.string().datetime().optional().or(z.literal("")),
  autoAsignar: z.boolean().optional().default(false),
  prioridad: z.enum(["VIP", "URGENTE", "MEDIA", "NORMAL"]).optional().default("NORMAL"),
});

// Schema para actualizar orden
export const ActualizarOrdenSchema = z.object({
  clienteNombre: z.string().min(2).max(200).optional(),
  clienteTelefono: z.string().regex(/^\+?[0-9\s\-()]+$/).max(20).optional(),
  clienteDireccion: z.string().min(5).max(500).optional(),
  descripcion: z.string().max(1000).optional(),
  prioridad: z.enum(["BAJA", "MEDIA", "ALTA", "URGENTE"]).optional(),
  notas: z.string().max(1000).optional(),
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

// Types inferidos
export type CrearOrdenInput = z.infer<typeof CrearOrdenSchema>;
export type ActualizarOrdenInput = z.infer<typeof ActualizarOrdenSchema>;
export type AsignarArmadorInput = z.infer<typeof AsignarArmadorSchema>;
export type CambiarEstadoOrdenInput = z.infer<typeof CambiarEstadoOrdenSchema>;
