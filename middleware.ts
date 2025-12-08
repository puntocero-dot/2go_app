import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "./lib/auth";

export async function middleware(request: NextRequest) {
  // 1. HTTPS Enforcement en producción
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
  const session = token ? await verifyToken(token) : null;
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

  return NextResponse.next();
}

function getDashboardUrl(rol: string): string {
  switch (rol) {
    case "ADMIN":
      return "/admin";
    case "SUPERVISOR":
      return "/supervisor";
    case "ARMADOR":
      return "/armador";
    default:
      return "/";
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};