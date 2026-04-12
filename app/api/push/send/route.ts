/**
 * POST /api/push/send
 * Envía una notificación push manual. Solo ADMIN.
 *
 * Body: { userId, title, body, url? }
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sendPushToUser } from "@/lib/web-push";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { z } from "zod";

const SendSchema = z.object({
  userId: z.string().uuid(),
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(200),
  url: z.string().optional(),
});

export async function POST(request: NextRequest) {
  if (!isFeatureEnabled("PUSH_NOTIFICATIONS")) {
    return NextResponse.json({ error: "Feature no habilitada" }, { status: 404 });
  }

  const session = await getSession();
  if (!session || session.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = SendSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.issues },
      { status: 400 }
    );
  }

  await sendPushToUser(parsed.data.userId, {
    title: parsed.data.title,
    body: parsed.data.body,
    url: parsed.data.url,
  });

  return NextResponse.json({ success: true });
}
