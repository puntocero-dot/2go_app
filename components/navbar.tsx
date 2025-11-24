"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, X, Home, Users, Package, FileText, Map, Settings, LogOut, User, BarChart3, DollarSign } from "lucide-react";

import { EnhancedButton } from "@/components/ui/enhanced-button";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <nav className="bg-negro-azabache text-white shadow-lg sticky top-0 z-50 backdrop-blur-sm bg-opacity-95 overflow-x-hidden">
      <div className="max-w-full mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex justify-between items-center h-16 gap-2">
          {/* Logo y Dashboard */}
          <div className="flex items-center space-x-8">
            <Link href={getDashboardLink()} className="flex items-center space-x-3 group">
              <div className="w-8 h-8 bg-madera-natural rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gradient">Armados 2Go</span>
            </Link>

            {/* Navigation Links - Desktop */}
            <div className="hidden md:flex items-center space-x-1">
              {user.rol === "ADMIN" && (
                <>
                  <Link href="/admin">
                    <EnhancedButton 
                      variant="ghost" 
                      size="sm"
                      className={cn(
                        "text-gray-300 hover:text-white hover:bg-white/10",
                        isActive("/admin") && "text-white bg-white/10"
                      )}
                    >
                      <Home className="w-4 h-4 mr-2" />
                      Dashboard
                    </EnhancedButton>
                  </Link>
                  <Link href="/admin/ordenes">
                    <EnhancedButton 
                      variant="ghost" 
                      size="sm"
                      className={cn(
                        "text-gray-300 hover:text-white hover:bg-white/10",
                        isActive("/admin/ordenes") && "text-white bg-white/10"
                      )}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Órdenes
                    </EnhancedButton>
                  </Link>
                  <Link href="/admin/facturacion">
                    <EnhancedButton 
                      variant="ghost" 
                      size="sm"
                      className={cn(
                        "text-gray-300 hover:text-white hover:bg-white/10",
                        isActive("/admin/facturacion") && "text-white bg-white/10"
                      )}
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Facturación
                    </EnhancedButton>
                  </Link>
                  <Link href="/admin/proyectos">
                    <EnhancedButton 
                      variant="ghost" 
                      size="sm"
                      className={cn(
                        "text-gray-300 hover:text-white hover:bg-white/10",
                        isActive("/admin/proyectos") && "text-white bg-white/10"
                      )}
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Proyectos
                    </EnhancedButton>
                  </Link>
                  <Link href="/admin/reportes/bi-dashboard">
                    <EnhancedButton 
                      variant="ghost" 
                      size="sm"
                      className={cn(
                        "text-gray-300 hover:text-white hover:bg-white/10",
                        isActive("/admin/reportes/bi-dashboard") && "text-white bg-white/10"
                      )}
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      BI Dashboard
                    </EnhancedButton>
                  </Link>
                  <Link href="/admin/mapa">
                    <EnhancedButton 
                      variant="ghost" 
                      size="sm"
                      className={cn(
                        "text-gray-300 hover:text-white hover:bg-white/10",
                        isActive("/admin/mapa") && "text-white bg-white/10"
                      )}
                    >
                      <Map className="w-4 h-4 mr-2" />
                      Mapa
                    </EnhancedButton>
                  </Link>
                  <Link href="/admin/usuarios">
                    <EnhancedButton 
                      variant="ghost" 
                      size="sm"
                      className={cn(
                        "text-gray-300 hover:text-white hover:bg-white/10",
                        isActive("/admin/usuarios") && "text-white bg-white/10"
                      )}
                    >
                      <User className="w-4 h-4 mr-2" />
                      Usuarios
                    </EnhancedButton>
                  </Link>
                </>
              )}

              {user.rol === "SUPERVISOR" && (
                <>
                  <Link href="/supervisor">
                    <EnhancedButton 
                      variant="ghost" 
                      size="sm"
                      className={cn(
                        "text-gray-300 hover:text-white hover:bg-white/10",
                        isActive("/supervisor") && "text-white bg-white/10"
                      )}
                    >
                      <Home className="w-4 h-4 mr-2" />
                      Dashboard
                    </EnhancedButton>
                  </Link>
                  <Link href="/admin/ordenes">
                    <EnhancedButton 
                      variant="ghost" 
                      size="sm"
                      className={cn(
                        "text-gray-300 hover:text-white hover:bg-white/10",
                        isActive("/admin/ordenes") && "text-white bg-white/10"
                      )}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Órdenes
                    </EnhancedButton>
                  </Link>
                  <Link href="/admin/mapa">
                    <EnhancedButton 
                      variant="ghost" 
                      size="sm"
                      className={cn(
                        "text-gray-300 hover:text-white hover:bg-white/10",
                        isActive("/admin/mapa") && "text-white bg-white/10"
                      )}
                    >
                      <Map className="w-4 h-4 mr-2" />
                      Mapa
                    </EnhancedButton>
                  </Link>
                </>
              )}

              {user.rol === "ARMADOR" && (
                <Link href="/armador">
                  <EnhancedButton 
                    variant="ghost" 
                    size="sm"
                    className={cn(
                      "text-gray-300 hover:text-white hover:bg-white/10",
                      isActive("/armador") && "text-white bg-white/10"
                    )}
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Mis Órdenes
                  </EnhancedButton>
                </Link>
              )}
            </div>
          </div>

          {/* Right side items */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <ThemeToggle />
            
            {/* User menu - desktop only */}
            <div className="hidden lg:flex items-center gap-2 px-2">
              <div className="text-right max-w-[120px]">
                <div className="text-xs font-medium text-white truncate">{user.nombre}</div>
                <div className="text-[10px] text-gray-400 capitalize">{user.rol.toLowerCase()}</div>
              </div>
              <div className="w-7 h-7 bg-terracota rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-3.5 h-3.5 text-white" />
              </div>
            </div>

            {/* Logout button - visible on all screen sizes */}
            <EnhancedButton 
              variant="outline" 
              size="sm"
              onClick={handleLogout}
              className="border-white/20 text-white hover:bg-white/10 hover:border-white/30 flex-shrink-0 px-2 sm:px-3"
              title="Cerrar sesión"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline ml-1.5 text-xs">Salir</span>
            </EnhancedButton>

            {/* Mobile menu button */}
            <EnhancedButton
              variant="ghost"
              size="icon"
              className="md:hidden text-white hover:bg-white/10"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </EnhancedButton>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-700 fade-in">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {user.rol === "ADMIN" && (
                <>
                  <Link href="/admin" className="block">
                    <EnhancedButton 
                      variant="ghost" 
                      className={cn(
                        "w-full justify-start text-gray-300 hover:text-white hover:bg-white/10",
                        isActive("/admin") && "text-white bg-white/10"
                      )}
                    >
                      <Home className="w-4 h-4 mr-2" />
                      Dashboard
                    </EnhancedButton>
                  </Link>
                  <Link href="/admin/ordenes" className="block">
                    <EnhancedButton 
                      variant="ghost" 
                      className={cn(
                        "w-full justify-start text-gray-300 hover:text-white hover:bg-white/10",
                        isActive("/admin/ordenes") && "text-white bg-white/10"
                      )}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Órdenes
                    </EnhancedButton>
                  </Link>
                  <Link href="/admin/proyectos" className="block">
                    <EnhancedButton 
                      variant="ghost" 
                      className={cn(
                        "w-full justify-start text-gray-300 hover:text-white hover:bg-white/10",
                        isActive("/admin/proyectos") && "text-white bg-white/10"
                      )}
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Proyectos
                    </EnhancedButton>
                  </Link>
                  <Link href="/admin/armadores" className="block">
                    <EnhancedButton 
                      variant="ghost" 
                      className={cn(
                        "w-full justify-start text-gray-300 hover:text-white hover:bg-white/10",
                        isActive("/admin/armadores") && "text-white bg-white/10"
                      )}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Armadores
                    </EnhancedButton>
                  </Link>
                  <Link href="/admin/mapa" className="block">
                    <EnhancedButton 
                      variant="ghost" 
                      className={cn(
                        "w-full justify-start text-gray-300 hover:text-white hover:bg-white/10",
                        isActive("/admin/mapa") && "text-white bg-white/10"
                      )}
                    >
                      <Map className="w-4 h-4 mr-2" />
                      Mapa
                    </EnhancedButton>
                  </Link>
                  <Link href="/admin/usuarios" className="block">
                    <EnhancedButton 
                      variant="ghost" 
                      className={cn(
                        "w-full justify-start text-gray-300 hover:text-white hover:bg-white/10",
                        isActive("/admin/usuarios") && "text-white bg-white/10"
                      )}
                    >
                      <User className="w-4 h-4 mr-2" />
                      Usuarios
                    </EnhancedButton>
                  </Link>
                </>
              )}

              {user.rol === "SUPERVISOR" && (
                <>
                  <Link href="/supervisor" className="block">
                    <EnhancedButton 
                      variant="ghost" 
                      className={cn(
                        "w-full justify-start text-gray-300 hover:text-white hover:bg-white/10",
                        isActive("/supervisor") && "text-white bg-white/10"
                      )}
                    >
                      <Home className="w-4 h-4 mr-2" />
                      Dashboard
                    </EnhancedButton>
                  </Link>
                  <Link href="/admin/ordenes" className="block">
                    <EnhancedButton 
                      variant="ghost" 
                      className={cn(
                        "w-full justify-start text-gray-300 hover:text-white hover:bg-white/10",
                        isActive("/admin/ordenes") && "text-white bg-white/10"
                      )}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Órdenes
                    </EnhancedButton>
                  </Link>
                  <Link href="/admin/mapa" className="block">
                    <EnhancedButton 
                      variant="ghost" 
                      className={cn(
                        "w-full justify-start text-gray-300 hover:text-white hover:bg-white/10",
                        isActive("/admin/mapa") && "text-white bg-white/10"
                      )}
                    >
                      <Map className="w-4 h-4 mr-2" />
                      Mapa
                    </EnhancedButton>
                  </Link>
                </>
              )}

              {user.rol === "ARMADOR" && (
                <Link href="/armador" className="block">
                  <EnhancedButton 
                    variant="ghost" 
                    className={cn(
                      "w-full justify-start text-gray-300 hover:text-white hover:bg-white/10",
                      isActive("/armador") && "text-white bg-white/10"
                    )}
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Mis Órdenes
                  </EnhancedButton>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
