/**
 * POST /api/push/subscribe
 * Registra una suscripción push para el usuario autenticado.
 *
 * Body: { endpoint, p256dh, auth }
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { z } from "zod";

const SubscribeSchema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
});

export async function POST(request: NextRequest) {
  if (!isFeatureEnabled("PUSH_NOTIFICATIONS")) {
    return NextResponse.json({ error: "Feature no habilitada" }, { status: 404 });
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = SubscribeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos de suscripción inválidos", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { endpoint, p256dh, auth } = parsed.data;

  // Upsert: actualizar si ya existe el endpoint, crear si no
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { userId: session.userId, endpoint, p256dh, auth },
    update: { userId: session.userId, p256dh, auth },
  });

  return NextResponse.json({ success: true });
}

/**
 * DELETE /api/push/subscribe
 * Elimina la suscripción push del usuario actual para el endpoint dado.
 */
export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const endpoint = body?.endpoint as string | undefined;

  if (!endpoint) {
    return NextResponse.json({ error: "Endpoint requerido" }, { status: 400 });
  }

  await prisma.pushSubscription
    .deleteMany({ where: { userId: session.userId, endpoint } })
    .catch(() => {});

  return NextResponse.json({ success: true });
}
