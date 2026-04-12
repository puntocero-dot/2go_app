/**
 * SSE Endpoint — Actualizaciones en tiempo real de estado de orden.
 *
 * Estrategia: polling a Redis cada 2s.
 * Cuando detecta un cambio de estado envía un evento SSE al cliente.
 * Mucho más eficiente que polling directo a PostgreSQL.
 *
 * Autenticación: token mágico (mismo que seguimiento público).
 * Max duración de conexión: 55s (límite Vercel Serverless).
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { readOrderState } from "@/lib/realtime/publisher";
import { isFeatureEnabled } from "@/lib/feature-flags";

type RouteContext = { params: Promise<{ id: string }> };

const POLL_INTERVAL_MS = 2000;
const MAX_DURATION_MS = 55_000; // 55s — margen antes del timeout de Vercel

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const token = request.nextUrl.searchParams.get("token");

  // Verificar que SSE esté habilitado
  if (!isFeatureEnabled("REALTIME_SSE")) {
    return new Response("SSE no habilitado", { status: 404 });
  }

  // Validar token mágico
  if (!token) {
    return new Response("Token requerido", { status: 401 });
  }

  const orden = await prisma.orden.findUnique({
    where: { id },
    select: { linkMagicoToken: true, estado: true },
  });

  if (!orden || orden.linkMagicoToken !== token) {
    return new Response("Token inválido", { status: 403 });
  }

  let lastEstado = orden.estado;
  const startTime = Date.now();

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const send = (event: string, data: object) => {
        const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(msg));
      };

      // Evento inicial de conexión
      send("connected", { ordenId: id, estado: lastEstado });

      const poll = async () => {
        if (Date.now() - startTime >= MAX_DURATION_MS) {
          send("timeout", { message: "Reconectar" });
          controller.close();
          return;
        }

        try {
          const stateEvent = await readOrderState(id);

          if (stateEvent && stateEvent.estado !== lastEstado) {
            lastEstado = stateEvent.estado as typeof lastEstado;
            send("estado", {
              ordenId: id,
              estado: stateEvent.estado,
              updatedAt: stateEvent.updatedAt,
            });
          }
        } catch {
          // Continuar polling aunque Redis falle
        }

        setTimeout(poll, POLL_INTERVAL_MS);
      };

      // Iniciar polling después del primer tick
      setTimeout(poll, POLL_INTERVAL_MS);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
