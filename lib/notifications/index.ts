/**
 * Sistema de Notificaciones en Tiempo Real
 * 
 * Implementación usando Server-Sent Events (SSE) como alternativa ligera a WebSockets.
 * Para producción con múltiples instancias, considerar migrar a Pusher o Ably.
 */

import { prisma } from "@/lib/prisma";

export type NotificationType =
  | "NUEVA_ORDEN"
  | "ORDEN_ASIGNADA"
  | "ORDEN_TOMADA"
  | "ORDEN_COMPLETADA"
  | "ORDEN_CANCELADA"
  | "TURNO_INICIADO"
  | "TURNO_FINALIZADO"
  | "ALERTA_PARADA"
  | "SISTEMA";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  createdAt: Date;
  read: boolean;
  userId: string;
}

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  recipientIds: string[];
}

/**
 * Crea y guarda una notificación en la base de datos
 */
export async function createNotification(payload: NotificationPayload): Promise<void> {
  const { type, title, message, data, recipientIds } = payload;

  // Crear notificaciones para cada destinatario usando el nuevo modelo
  await prisma.notificacionUsuario.createMany({
    data: recipientIds.map((userId) => ({
      tipo: type,
      titulo: title,
      mensaje: message,
      datos: data ? JSON.parse(JSON.stringify(data)) : undefined,
      usuarioId: userId,
      leida: false,
    })),
  });
}

/**
 * Notifica a un armador sobre una nueva orden asignada
 */
export async function notificarNuevaOrden(
  armadorId: string,
  orden: {
    id: string;
    codigoReferencia?: string | null;
    clienteNombre?: string | null;
    clienteDireccion?: string | null;
    prioridad?: string | null;
  }
): Promise<void> {
  // Buscar el usuario asociado al armador
  const armador = await prisma.armador.findUnique({
    where: { id: armadorId },
    select: { usuarioId: true, usuario: { select: { nombre: true } } },
  });

  if (!armador) return;

  await createNotification({
    type: "ORDEN_ASIGNADA",
    title: "Nueva orden asignada",
    message: `Se te ha asignado la orden ${orden.codigoReferencia || orden.id}`,
    data: {
      ordenId: orden.id,
      cliente: orden.clienteNombre,
      direccion: orden.clienteDireccion,
      prioridad: orden.prioridad,
    },
    recipientIds: [armador.usuarioId],
  });
}

/**
 * Notifica a admins y supervisores cuando un armador toma una orden
 */
export async function notificarOrdenTomada(
  orden: {
    id: string;
    codigoReferencia?: string | null;
    proyectoId: string;
  },
  armadorNombre: string
): Promise<void> {
  // Buscar admins y supervisores del proyecto
  const admins = await prisma.usuario.findMany({
    where: { rol: "ADMIN", activo: true },
    select: { id: true },
  });

  const supervisores = await prisma.supervisorProyecto.findMany({
    where: { proyectoId: orden.proyectoId },
    select: { usuarioId: true },
  });

  const recipientIds = [
    ...admins.map((a) => a.id),
    ...supervisores.map((s) => s.usuarioId),
  ];

  if (recipientIds.length === 0) return;

  await createNotification({
    type: "ORDEN_TOMADA",
    title: "Orden tomada",
    message: `${armadorNombre} ha tomado la orden ${orden.codigoReferencia || orden.id}`,
    data: {
      ordenId: orden.id,
      armadorNombre,
    },
    recipientIds,
  });
}

/**
 * Notifica cuando una orden se completa
 */
export async function notificarOrdenCompletada(
  orden: {
    id: string;
    codigoReferencia?: string | null;
    proyectoId: string;
    clienteNombre?: string | null;
  }
): Promise<void> {
  // Buscar admins y supervisores del proyecto
  const admins = await prisma.usuario.findMany({
    where: { rol: "ADMIN", activo: true },
    select: { id: true },
  });

  const supervisores = await prisma.supervisorProyecto.findMany({
    where: { proyectoId: orden.proyectoId },
    select: { usuarioId: true },
  });

  const recipientIds = [
    ...admins.map((a) => a.id),
    ...supervisores.map((s) => s.usuarioId),
  ];

  if (recipientIds.length === 0) return;

  await createNotification({
    type: "ORDEN_COMPLETADA",
    title: "Orden completada",
    message: `La orden ${orden.codigoReferencia || orden.id} ha sido completada`,
    data: {
      ordenId: orden.id,
      cliente: orden.clienteNombre,
    },
    recipientIds,
  });
}

/**
 * Alerta de parada prolongada de un armador
 */
export async function notificarAlertaParada(
  armador: {
    id: string;
    nombre: string;
    ultimaUbicacion?: { lat: number; lng: number };
  },
  minutosDetenido: number
): Promise<void> {
  // Notificar a todos los admins
  const admins = await prisma.usuario.findMany({
    where: { rol: "ADMIN", activo: true },
    select: { id: true },
  });

  if (admins.length === 0) return;

  await createNotification({
    type: "ALERTA_PARADA",
    title: "⚠️ Alerta de parada prolongada",
    message: `${armador.nombre} lleva ${minutosDetenido} minutos detenido`,
    data: {
      armadorId: armador.id,
      armadorNombre: armador.nombre,
      minutosDetenido,
      ubicacion: armador.ultimaUbicacion,
    },
    recipientIds: admins.map((a) => a.id),
  });
}

/**
 * Obtiene notificaciones no leídas de un usuario
 */
export async function getUnreadNotifications(userId: string): Promise<Notification[]> {
  const notificaciones = await prisma.notificacionUsuario.findMany({
    where: {
      usuarioId: userId,
      leida: false,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return notificaciones.map((n) => ({
    id: n.id,
    type: n.tipo as NotificationType,
    title: n.titulo,
    message: n.mensaje,
    data: (n.datos as Record<string, unknown>) || {},
    createdAt: n.createdAt,
    read: n.leida,
    userId: n.usuarioId,
  }));
}

/**
 * Marca notificaciones como leídas
 */
export async function markNotificationsAsRead(
  notificationIds: string[],
  userId: string
): Promise<void> {
  await prisma.notificacionUsuario.updateMany({
    where: {
      id: { in: notificationIds },
      usuarioId: userId,
    },
    data: { leida: true },
  });
}

/**
 * Cuenta notificaciones no leídas
 */
export async function countUnreadNotifications(userId: string): Promise<number> {
  return prisma.notificacionUsuario.count({
    where: {
      usuarioId: userId,
      leida: false,
    },
  });
}
