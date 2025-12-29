import { NextRequest } from "next/server";
import { prisma } from "./prisma";
import { getClientIp } from "./rate-limit";

export type AuditAction =
  // Ordenes
  | "CREATE_ORDER"
  | "UPDATE_ORDER"
  | "DELETE_ORDER"
  | "ASSIGN_ORDER"
  | "CHANGE_ORDER_STATUS"
  | "CANCEL_ORDER"
  // Turnos
  | "START_SHIFT"
  | "END_SHIFT"
  | "UPDATE_LOCATION"
  // Usuarios
  | "CREATE_USER"
  | "UPDATE_USER"
  | "DELETE_USER"
  | "CHANGE_USER_STATUS"
  | "CHANGE_LOGIN_STATUS"
  | "UPDATE_PROFILE"
  | "CHANGE_PASSWORD"
  // Configuración
  | "UPDATE_BILLING_CONFIG"
  | "UPDATE_SYSTEM_CONFIG"
  | "UPDATE_GEOMAPS_CONFIG"
  // Proyectos
  | "CREATE_PROJECT"
  | "UPDATE_PROJECT"
  | "DELETE_PROJECT"
  // Muebles
  | "CREATE_FURNITURE"
  | "UPDATE_FURNITURE"
  | "DELETE_FURNITURE"
  // Clientes
  | "CREATE_CLIENT"
  | "UPDATE_CLIENT"
  | "DELETE_CLIENT"
  // Uploads
  | "UPLOAD_FILE"
  | "DELETE_FILE"
  // Auth
  | "LOGIN"
  | "LOGOUT"
  | "FAILED_LOGIN"
  // Horarios
  | "CREATE_SCHEDULE"
  | "UPDATE_SCHEDULE"
  | "DELETE_SCHEDULE"
  // Otros
  | "BULK_OPERATION"
  | "EXPORT_DATA";

export type AuditResource =
  | "orden"
  | "turno"
  | "usuario"
  | "armador"
  | "proyecto"
  | "mueble"
  | "cliente"
  | "configuracion"
  | "archivo"
  | "auth"
  | "sistema"
  | "horario_programado";

export interface LogAuditParams {
  userId: string;
  userName: string;
  userRole: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string;
  changes?: {
    before?: any;
    after?: any;
  };
  metadata?: Record<string, any>;
  request?: NextRequest;
  status?: "SUCCESS" | "FAILED" | "BLOCKED";
  errorMsg?: string;
}

/**
 * Registra una acción en el log de auditoría
 */
export async function logAudit(params: LogAuditParams): Promise<void> {
  try {
    const {
      userId,
      userName,
      userRole,
      action,
      resource,
      resourceId,
      changes,
      metadata,
      request,
      status = "SUCCESS",
      errorMsg,
    } = params;

    // Extraer IP y User Agent si se proporciona request
    let ip: string | undefined;
    let userAgent: string | undefined;

    if (request) {
      ip = getClientIp(request);
      userAgent = request.headers.get("user-agent") || undefined;
    }

    // Crear registro de auditoría
    await prisma.auditLog.create({
      data: {
        userId,
        userName,
        userRole,
        action,
        resource,
        resourceId,
        changes: changes ? JSON.parse(JSON.stringify(changes)) : null,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
        ip,
        userAgent,
        status,
        errorMsg,
      },
    });

    // Log en consola solo en desarrollo
    if (process.env.NODE_ENV === "development") {
      console.log(`[AUDIT] ${action} on ${resource} by ${userName} (${userRole})`);
    }
  } catch (error) {
    // No fallar la operación principal si falla el log de auditoría
    console.error("[AUDIT ERROR] Failed to log audit:", error);
  }
}

/**
 * Helper para crear un log de auditoría desde un session y request
 */
export async function logAuditFromSession(params: {
  session: { userId: string; nombre?: string; rol: string };
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string;
  changes?: { before?: any; after?: any };
  metadata?: Record<string, any>;
  request?: NextRequest;
  status?: "SUCCESS" | "FAILED" | "BLOCKED";
  errorMsg?: string;
}): Promise<void> {
  const { session, ...rest } = params;

  await logAudit({
    userId: session.userId,
    userName: session.nombre || "Usuario",
    userRole: session.rol,
    ...rest,
  });
}

/**
 * Helper para queries de auditoría con filtros
 */
export async function getAuditLogs(filters: {
  userId?: string;
  action?: AuditAction;
  resource?: AuditResource;
  resourceId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const {
    userId,
    action,
    resource,
    resourceId,
    status,
    startDate,
    endDate,
    limit = 50,
    offset = 0,
  } = filters;

  const where: any = {};

  if (userId) where.userId = userId;
  if (action) where.action = action;
  if (resource) where.resource = resource;
  if (resourceId) where.resourceId = resourceId;
  if (status) where.status = status;

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
  };
}

/**
 * Helper para exportar logs a CSV
 */
export function exportAuditLogsToCSV(logs: any[]): string {
  const headers = [
    "ID",
    "Fecha",
    "Usuario",
    "Rol",
    "Acción",
    "Recurso",
    "Recurso ID",
    "IP",
    "Estado",
    "Error",
  ];

  const rows = logs.map((log) => [
    log.id,
    new Date(log.createdAt).toISOString(),
    log.userName,
    log.userRole,
    log.action,
    log.resource,
    log.resourceId || "",
    log.ip || "",
    log.status,
    log.errorMsg || "",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  return csvContent;
}
