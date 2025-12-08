"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, X, Home, Users, Package, FileText, Map, Settings, LogOut, User, BarChart3, DollarSign, Clock, Route } from "lucide-react";

import { EnhancedButton } from "@/components/ui/enhanced-button";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { EstadoLoggeoSelector } from "./estado-loggeo-selector";

interface NavbarProps {
  user: {
    nombre: string;
    email: string;
    rol: "ADMIN" | "SUPERVISOR" | "ARMADOR";
    estadoLoggeo?: string | null;
    fotoPerfil?: string | null;
  };
}

export function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const handleCambioEstado = async (nuevoEstado: string) => {
    try {
      const response = await fetch("/api/usuarios/estado-loggeo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estadoLoggeo: nuevoEstado }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Error cambiando estado:", error);
    }
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
    <nav className="bg-negro-azabache text-white shadow-lg sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
      <div className="max-w-full mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex justify-between items-center h-16 gap-2">
          {/* Logo y Dashboard */}
          <div className="flex items-center space-x-4 md:space-x-8">
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
                  <Link href="/admin/reportes/tiempos-pedido">
                    <EnhancedButton 
                      variant="ghost" 
                      size="sm"
                      className={cn(
                        "text-gray-300 hover:text-white hover:bg-white/10",
                        isActive("/admin/reportes/tiempos-pedido") && "text-white bg-white/10"
                      )}
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Tiempos
                    </EnhancedButton>
                  </Link>
                  <Link href="/admin/rutas">
                    <EnhancedButton 
                      variant="ghost" 
                      size="sm"
                      className={cn(
                        "text-gray-300 hover:text-white hover:bg-white/10",
                        isActive("/admin/rutas") && "text-white bg-white/10"
                      )}
                    >
                      <Route className="w-4 h-4 mr-2" />
                      Rutas
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
                  <Link href="/admin/reportes/tiempos-pedido">
                    <EnhancedButton 
                      variant="ghost" 
                      size="sm"
                      className={cn(
                        "text-gray-300 hover:text-white hover:bg-white/10",
                        isActive("/admin/reportes/tiempos-pedido") && "text-white bg-white/10"
                      )}
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Tiempos
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
            <div className="hidden sm:block">
              <EstadoLoggeoSelector
                estadoActual={user.estadoLoggeo || "OFFLINE"}
                onCambioEstado={handleCambioEstado}
              />
            </div>

            <div className="relative hidden sm:flex">
              <EnhancedButton
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 text-gray-300 hover:text-white hover:bg-white/10"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <div className="text-right max-w-[120px] hidden lg:block">
                  <div className="text-xs font-medium text-white truncate">{user.nombre}</div>
                  <div className="text-[10px] text-gray-400 capitalize">
                    {typeof user.rol === "string" ? user.rol.toLowerCase() : ""}
                  </div>
                </div>
                {user.fotoPerfil ? (
                  <img
                    src={user.fotoPerfil}
                    alt={user.nombre}
                    className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                    onError={(e) => {
                      e.currentTarget.src = "https://via.placeholder.com/28";
                    }}
                  />
                ) : (
                  <div className="w-7 h-7 bg-terracota rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </EnhancedButton>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-md bg-negro-azabache border border-gray-700 shadow-lg z-50 py-2">
                  <div className="px-3 pb-2 flex items-center justify-between">
                    <div className="text-xs text-gray-300">
                      <div className="font-medium truncate max-w-[140px]">{user.nombre}</div>
                      <div className="text-[10px] text-gray-400 capitalize">
                        {typeof user.rol === "string" ? user.rol.toLowerCase() : ""}
                      </div>
                    </div>
                    <ThemeToggle />
                  </div>

                  {user.rol !== "ARMADOR" && (
                    <Link href="/admin/perfil">
                      <button className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>Mi Perfil</span>
                      </button>
                    </Link>
                  )}

                  {user.rol === "ADMIN" && (
                    <>
                      <Link href="/admin/configuracion/facturacion">
                        <button className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          <span>Config. Facturación</span>
                        </button>
                      </Link>
                      <Link href="/admin/configuracion/geomaps">
                        <button className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2">
                          <Map className="w-4 h-4" />
                          <span>Config. Geomaps</span>
                        </button>
                      </Link>
                    </>
                  )}

                  <div className="border-t border-gray-700 mt-2 pt-2">
                    <button
                      className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Cerrar sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

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
                  <Link href="/admin/reportes/bi-dashboard" className="block">
                    <EnhancedButton 
                      variant="ghost" 
                      className={cn(
                        "w-full justify-start text-gray-300 hover:text-white hover:bg-white/10",
                        isActive("/admin/reportes/bi-dashboard") && "text-white bg-white/10"
                      )}
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      BI Dashboard
                    </EnhancedButton>
                  </Link>
                  <Link href="/admin/reportes/tiempos-pedido" className="block">
                    <EnhancedButton 
                      variant="ghost" 
                      className={cn(
                        "w-full justify-start text-gray-300 hover:text-white hover:bg-white/10",
                        isActive("/admin/reportes/tiempos-pedido") && "text-white bg-white/10"
                      )}
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Tiempos
                    </EnhancedButton>
                  </Link>
                  <Link href="/admin/rutas" className="block">
                    <EnhancedButton 
                      variant="ghost" 
                      className={cn(
                        "w-full justify-start text-gray-300 hover:text-white hover:bg-white/10",
                        isActive("/admin/rutas") && "text-white bg-white/10"
                      )}
                    >
                      <Route className="w-4 h-4 mr-2" />
                      Rutas
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

              {/* Enlaces comunes para todos */}
              <div className="border-t border-gray-700 mt-2 pt-2 space-y-1">
                {user.rol !== "ARMADOR" && (
                  <Link href="/admin/perfil" className="block">
                    <EnhancedButton
                      variant="ghost"
                      className={cn(
                        "w-full justify-start text-gray-300 hover:text-white hover:bg-white/10",
                        isActive("/admin/perfil") && "text-white bg-white/10"
                      )}
                    >
                      <User className="w-4 h-4 mr-2" />
                      Mi Perfil
                    </EnhancedButton>
                  </Link>
                )}

                {user.rol === "ADMIN" && (
                  <>
                    <Link href="/admin/configuracion/facturacion" className="block">
                      <EnhancedButton
                        variant="ghost"
                        className={cn(
                          "w-full justify-start text-gray-300 hover:text-white hover:bg-white/10",
                          isActive("/admin/configuracion/facturacion") && "text-white bg-white/10"
                        )}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Config. Facturación
                      </EnhancedButton>
                    </Link>
                    <Link href="/admin/configuracion/geomaps" className="block">
                      <EnhancedButton
                        variant="ghost"
                        className={cn(
                          "w-full justify-start text-gray-300 hover:text-white hover:bg-white/10",
                          isActive("/admin/configuracion/geomaps") && "text-white bg-white/10"
                        )}
                      >
                        <Map className="w-4 h-4 mr-2" />
                        Config. Geomaps
                      </EnhancedButton>
                    </Link>
                  </>
                )}

                <button
                  className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar sesión</span>
                </button>

                {/* Selector de estado en móvil */}
                <div className="px-3 py-2">
                  <EstadoLoggeoSelector
                    estadoActual={user.estadoLoggeo || "OFFLINE"}
                    onCambioEstado={handleCambioEstado}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
