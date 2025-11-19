"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

interface NavbarProps {
  user: {
    nombre: string;
    email: string;
    rol: "ADMIN" | "SUPERVISOR" | "ARMADOR";
  };
}

export function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const getDashboardLink = () => {
    switch (user.rol) {
      case "ADMIN":
        return "/admin";
      case "SUPERVISOR":
        return "/supervisor";
      case "ARMADOR":
        return "/armador";
      default:
        return "/";
    }
  };

  const isActive = (path: string) => {
    if (!pathname) return false;
    if (path === "/armador" && pathname === "/armador") return true;
    if (path !== "/armador" && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="bg-negro-azabache text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <Link href={getDashboardLink()} className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight">Armados 2Go</span>
            </Link>

            <div className="hidden md:flex items-center gap-4">
              {user.rol === "ADMIN" && (
                <>
                  <Link
                    href="/admin"
                    className={cn(
                      "relative px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive("/admin")
                        ? "bg-white/10 text-white"
                        : "text-white/80 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    Dashboard
                    {isActive("/admin") && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-madera-natural" />
                    )}
                  </Link>
                  <Link
                    href="/admin/proyectos"
                    className={cn(
                      "relative px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive("/admin/proyectos")
                        ? "bg-white/10 text-white"
                        : "text-white/80 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    Proyectos
                    {isActive("/admin/proyectos") && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-madera-natural" />
                    )}
                  </Link>
                  <Link
                    href="/admin/ordenes"
                    className={cn(
                      "relative px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive("/admin/ordenes")
                        ? "bg-white/10 text-white"
                        : "text-white/80 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    Órdenes
                    {isActive("/admin/ordenes") && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-madera-natural" />
                    )}
                  </Link>
                  <Link
                    href="/admin/facturacion"
                    className={cn(
                      "relative px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive("/admin/facturacion")
                        ? "bg-white/10 text-white"
                        : "text-white/80 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    Facturación
                    {isActive("/admin/facturacion") && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-madera-natural" />
                    )}
                  </Link>
                  <Link
                    href="/admin/usuarios"
                    className={cn(
                      "relative px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive("/admin/usuarios")
                        ? "bg-white/10 text-white"
                        : "text-white/80 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    Usuarios
                    {isActive("/admin/usuarios") && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-madera-natural" />
                    )}
                  </Link>
                </>
              )}

              {user.rol === "SUPERVISOR" && (
                <>
                  <Link
                    href="/supervisor"
                    className={cn(
                      "relative px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive("/supervisor")
                        ? "bg-white/10 text-white"
                        : "text-white/80 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    Dashboard
                    {isActive("/supervisor") && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-madera-natural" />
                    )}
                  </Link>
                  <Link
                    href="/supervisor/ordenes"
                    className={cn(
                      "relative px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive("/supervisor/ordenes")
                        ? "bg-white/10 text-white"
                        : "text-white/80 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    Órdenes
                    {isActive("/supervisor/ordenes") && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-madera-natural" />
                    )}
                  </Link>
                </>
              )}

              {user.rol === "ARMADOR" && (
                <Link
                  href="/armador"
                  className={cn(
                    "relative px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive("/armador")
                      ? "bg-white/10 text-white"
                      : "text-white/80 hover:bg-white/5 hover:text-white",
                  )}
                >
                  Mis Órdenes
                  {isActive("/armador") && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-madera-natural" />
                  )}
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right text-sm">
              <div className="font-medium">{user.nombre}</div>
              <div className="text-xs text-white/70">{user.rol}</div>
            </div>
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              className="border-white/40 bg-white/5 text-white hover:bg-white/10"
              onClick={handleLogout}
            >
              Cerrar sesión
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}