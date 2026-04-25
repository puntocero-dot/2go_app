import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyTokenWithExpiry, createToken } from "./lib/auth";

export async function middleware(request: NextRequest) {
  // 1. HTTPS Enforcement en produccion (confiable en Vercel que valida x-forwarded-proto)
  if (
    process.env.NODE_ENV === "production" &&
    request.headers.get("x-forwarded-proto") !== "https"
  ) {
    return NextResponse.redirect(
      `https://${request.headers.get("host")}${request.nextUrl.pathname}${request.nextUrl.search}`,
      301
    );
  }

  const token = request.cookies.get("session")?.value;
  const { session, shouldRefresh } = token
    ? await verifyTokenWithExpiry(token)
    : { session: null, shouldRefresh: false };
  const { pathname } = request.nextUrl;

  const invalidateSession = () => {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("session");
    return response;
  };

  const publicRoutes = [
    "/",
    "/login",
    "/orden/seguimiento",
    "/manifest.json",
    "/sw.js",
    "/icon-192.png",
    "/icon-512.png",
    "/bg-login.jpg",
  ];
  const isPublicRoute =
    publicRoutes.includes(pathname) || pathname.startsWith("/seguimiento/");

  // Para rutas públicas (inicio, login, seguimiento), no forzamos
  // redirecciones automáticas al dashboard aunque exista sesión.
  // Esto evita bucles del tipo /admin -> /login -> /admin en caso de
  // discrepancias entre el middleware y las páginas protegidas.
  if (isPublicRoute) {
    return NextResponse.next();
  }

  if (!session) {
    return invalidateSession();
  }

  if (pathname.startsWith("/admin")) {
    if (session.rol === "ADMIN") {
      return NextResponse.next();
    }

    const supervisorAllowed =
      session.rol === "SUPERVISOR" &&
      (pathname.startsWith("/admin/ordenes") ||
        pathname.startsWith("/admin/mapa") ||
        pathname.startsWith("/admin/reportes/tiempos-pedido"));

    if (supervisorAllowed) {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL("/", request.url));
  }
  if (pathname.startsWith("/supervisor") && session.rol !== "SUPERVISOR") {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (pathname.startsWith("/armador") && session.rol !== "ARMADOR") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Auto-refresh: si el token esta proximo a expirar, renovar la cookie
  if (shouldRefresh && session) {
    const response = NextResponse.next();
    const newToken = await createToken({
      userId: session.userId,
      email: session.email,
      rol: session.rol,
    });
    response.cookies.set("session", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 4, // 4 horas
      path: "/",
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};