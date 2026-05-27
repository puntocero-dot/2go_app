import { NextRequest, NextResponse } from "next/server";
import { verifyToken, createSession } from "@/lib/auth";
import { withCsrf, withRateLimit } from "@/lib/api-helpers";
import { RATE_LIMITS, getClientIp } from "@/lib/rate-limit";

const refreshHandler = async (request: NextRequest): Promise<Response> => {
  try {
    const token = request.cookies.get("session")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "No hay sesión activa" },
        { status: 401 }
      );
    }

    const session = await verifyToken(token);

    if (!session) {
      return NextResponse.json(
        { error: "Sesión expirada o inválida" },
        { status: 401 }
      );
    }

    // Renovar la sesión con un nuevo token
    await createSession({
      userId: session.userId,
      email: session.email,
      rol: session.rol,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
};

// Rate limit por IP para evitar brute force / abuse del refresh.
// CSRF guard para que un origin malicioso no pueda renovar sesiones de la víctima.
export const POST = withCsrf(
  withRateLimit(
    refreshHandler,
    RATE_LIMITS.DEFAULT,
    (req) => `auth-refresh:${getClientIp(req)}`
  )
);
