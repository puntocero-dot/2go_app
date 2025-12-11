import { NextRequest, NextResponse } from "next/server";
import { destroySession, getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditFromSession } from "@/lib/audit-logger";

export async function POST(request: NextRequest) {
  try {
    // Obtener sesión antes de destruirla
    const session = await getSession();

    // Si es ARMADOR, finalizar turno automáticamente
    if (session && session.rol === "ARMADOR") {
      try {
        const armador = await prisma.armador.findUnique({
          where: { usuarioId: session.userId },
        });

        if (armador) {
          // Finalizar todos los turnos activos del armador
          await prisma.turno.updateMany({
            where: {
              armadorId: armador.id,
              estado: "ACTIVO",
            },
            data: {
              estado: "FINALIZADO",
              finTurno: new Date(),
            },
          });
        }
      } catch (error) {
        console.error("Error finalizando turno automático:", error);
        // No fallar el logout si hay error en el turno
      }
    }

    // Registrar auditoría
    if (session) {
      const usuario = await prisma.usuario.findUnique({
        where: { id: session.userId },
        select: { nombre: true },
      });

      await logAuditFromSession({
        session: {
          userId: session.userId,
          nombre: usuario?.nombre || "Usuario",
          rol: session.rol,
        },
        action: "LOGOUT",
        resource: "auth",
        resourceId: session.userId,
        request,
      });
    }

    await destroySession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en logout:", error);
    await destroySession();
    return NextResponse.json({ success: true });
  }
}

export async function GET(request: NextRequest) {
  await destroySession();
  const redirectTo =
    request.nextUrl.searchParams.get("redirect") ?? "/login";
  return NextResponse.redirect(new URL(redirectTo, request.url));
}