import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  getUnreadNotifications,
  countUnreadNotifications,
  markNotificationsAsRead,
} from "@/lib/notifications";

/**
 * GET /api/notificaciones
 * Obtiene notificaciones del usuario actual
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const countOnly = searchParams.get("count") === "true";

    if (countOnly) {
      const count = await countUnreadNotifications(session.userId);
      return NextResponse.json({ count });
    }

    const notifications = await getUnreadNotifications(session.userId);
    const count = notifications.length;

    return NextResponse.json({
      notifications,
      count,
    });
  } catch (error) {
    console.error("Error obteniendo notificaciones:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/notificaciones
 * Marca notificaciones como leídas
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { notificationIds } = body;

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json(
        { error: "Se requiere un array de IDs de notificaciones" },
        { status: 400 }
      );
    }

    await markNotificationsAsRead(notificationIds, session.userId);

    return NextResponse.json({
      message: "Notificaciones marcadas como leídas",
      count: notificationIds.length,
    });
  } catch (error) {
    console.error("Error marcando notificaciones:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
