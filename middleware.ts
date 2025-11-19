import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "./lib/auth";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("session")?.value;
  const session = token ? await verifyToken(token) : null;
  const { pathname } = request.nextUrl;

  const invalidateSession = () => {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("session");
    return response;
  };

  const publicRoutes = ["/", "/login", "/orden/seguimiento"];
  const isPublicRoute =
    publicRoutes.includes(pathname) || pathname.startsWith("/seguimiento/");

  if (isPublicRoute) {
    if (session && pathname === "/login") {
      const dashboardUrl = getDashboardUrl(session.rol);
      return NextResponse.redirect(new URL(dashboardUrl, request.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    return invalidateSession();
  }

  if (pathname.startsWith("/admin") && session.rol !== "ADMIN") {
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