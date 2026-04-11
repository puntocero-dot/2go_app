"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Menu, X, Home, Users, Package, FileText, Map, Settings, LogOut, User, BarChart3, DollarSign, Clock, Route, Building2, Timer, Calendar } from "lucide-react";

import { EnhancedButton } from "@/components/ui/enhanced-button";
import { cn } from "@/lib/utils";
import { addToast } from "@/components/ui/toaster";
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
  const [workforceOpen, setWorkforceOpen] = useState(false);
  const [workforceDesktopOpen, setWorkforceDesktopOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const workforceDesktopRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  // Cerrar menú de usuario al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userMenuOpen]);

  // Cerrar dropdown de WorkForce desktop al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (workforceDesktopRef.current && !workforceDesktopRef.current.contains(event.target as Node)) {
        setWorkforceDesktopOpen(false);
      }
    };

    if (workforceDesktopOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [workforceDesktopOpen]);

  useEffect(() => {
    const handleClickOutsideMobile = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
        setWorkforceOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutsideMobile);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutsideMobile);
    };
  }, [mobileMenuOpen]);

  const handleCambioEstado = async (nuevoEstado: string) => {
    try {
      const response = await fetch("/api/usuarios/estado-loggeo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estadoLoggeo: nuevoEstado }),
      });

      if (response.ok) {
        router.refresh();
      } else {
        const error = await response.json();
        console.error("Error cambiando estado:", error);
        addToast({ title: "Error", description: error.error || "No se pudo cambiar el estado", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error cambiando estado:", error);
      addToast({ title: "Error al cambiar estado", variant: "destructive" });
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
    // Match exacto para rutas raíz de cada sección
    if (path === "/admin" && pathname === "/admin") return true;
    if (path === "/supervisor" && pathname === "/supervisor") return true;
    if (path === "/armador" && pathname === "/armador") return true;
    // Para subrutas, verificar que empiece con el path Y que no sea la ruta raíz
    if (path !== "/admin" && path !== "/supervisor" && path !== "/armador") {
      return pathname.startsWith(path);
    }
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
                  <Link href="/admin/administracion">
                    <EnhancedButton 
                      variant="ghost" 
                      size="sm"
                      className={cn(
                        "text-gray-300 hover:text-white hover:bg-white/10",
                        isActive("/admin/administracion") && "text-white bg-white/10"
                      )}
                    >
                      <Building2 className="w-4 h-4 mr-2" />
                      Administración
                    </EnhancedButton>
                  </Link>
                  <div className="relative" ref={workforceDesktopRef}>
                    <EnhancedButton 
                      variant="ghost" 
                      size="sm"
                      className={cn(
                        "text-gray-300 hover:text-white hover:bg-white/10",
                        workforceDesktopOpen && "text-white bg-white/10"
                      )}
                      onClick={() => setWorkforceDesktopOpen((prev) => !prev)}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      WorkForce
                    </EnhancedButton>
                    {workforceDesktopOpen && (
                      <div className="absolute left-0 mt-2 w-56 rounded-md bg-negro-azabache border border-gray-700 shadow-lg z-40 py-2">
                        <Link href="/admin/reportes/bi-dashboard" onClick={() => setWorkforceDesktopOpen(false)}>
                          <button className={cn(
                            "w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2",
                            isActive("/admin/reportes/bi-dashboard") && "bg-white/10 text-white"
                          )}>
                            <BarChart3 className="w-4 h-4" /> BI Dashboard
                          </button>
                        </Link>
                        <Link href="/admin/turnos" onClick={() => setWorkforceDesktopOpen(false)}>
                          <button className={cn(
                            "w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2",
                            isActive("/admin/turnos") && "bg-white/10 text-white"
                          )}>
                            <Timer className="w-4 h-4" /> Turnos
                          </button>
                        </Link>
                        <Link href="/admin/mapa" onClick={() => setWorkforceDesktopOpen(false)}>
                          <button className={cn(
                            "w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2",
                            isActive("/admin/mapa") && "bg-white/10 text-white"
                          )}>
                            <Map className="w-4 h-4" /> Mapa
                          </button>
                        </Link>
                        <Link href="/admin/reportes/tiempos-pedido" onClick={() => setWorkforceDesktopOpen(false)}>
                          <button className={cn(
                            "w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2",
                            isActive("/admin/reportes/tiempos-pedido") && "bg-white/10 text-white"
                          )}>
                            <Clock className="w-4 h-4" /> Tiempos
                          </button>
                        </Link>
                        <Link href="/admin/rutas" onClick={() => setWorkforceDesktopOpen(false)}>
                          <button className={cn(
                            "w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2",
                            isActive("/admin/rutas") && "bg-white/10 text-white"
                          )}>
                            <Route className="w-4 h-4" /> Rutas
                          </button>
                        </Link>
                        <Link href="/admin/reportes" onClick={() => setWorkforceDesktopOpen(false)}>
                          <button className={cn(
                            "w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2",
                            isActive("/admin/reportes") && !isActive("/admin/reportes/bi-dashboard") && !isActive("/admin/reportes/tiempos-pedido") && "bg-white/10 text-white"
                          )}>
                            <FileText className="w-4 h-4" /> Reportes Pivot
                          </button>
                        </Link>
                      </div>
                    )}
                  </div>
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
                <>
                  <Link href="/armador">
                    <EnhancedButton 
                      variant="ghost" 
                      size="sm"
                      className={cn(
                        "text-gray-300 hover:text-white hover:bg-white/10",
                        isActive("/armador") && !isActive("/armador/calendario") && "text-white bg-white/10"
                      )}
                    >
                      <Home className="w-4 h-4 mr-2" />
                      Mis Órdenes
                    </EnhancedButton>
                  </Link>
                  <Link href="/armador/calendario">
                    <EnhancedButton 
                      variant="ghost" 
                      size="sm"
                      className={cn(
                        "text-gray-300 hover:text-white hover:bg-white/10",
                        isActive("/armador/calendario") && "text-white bg-white/10"
                      )}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Calendario
                    </EnhancedButton>
                  </Link>
                </>
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

            <div className="relative hidden sm:flex" ref={userMenuRef}>
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
                <div className="absolute right-0 top-full mt-2 w-64 rounded-md bg-negro-azabache border border-gray-700 shadow-lg z-50 py-2">
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
                    <Link href="/admin/perfil" onClick={() => setUserMenuOpen(false)}>
                      <button className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>Mi Perfil</span>
                      </button>
                    </Link>
                  )}

                  {user.rol === "ADMIN" && (
                    <>
                      <Link href="/admin/configuracion/facturacion" onClick={() => setUserMenuOpen(false)}>
                        <button className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          <span>Config. Facturación</span>
                        </button>
                      </Link>
                      <Link href="/admin/configuracion/geomaps" onClick={() => setUserMenuOpen(false)}>
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
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleLogout();
                      }}
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
          <div className="md:hidden border-t border-gray-700 fade-in" ref={mobileMenuRef}>
            <div className="flex items-center justify-between px-2 pt-3 pb-1">
              <span className="text-sm text-gray-300">Menú</span>
              <EnhancedButton
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setWorkforceOpen(false);
                }}
              >
                <X className="w-5 h-5" />
              </EnhancedButton>
            </div>
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
                  <Link href="/admin/administracion" className="block">
                    <EnhancedButton 
                      variant="ghost" 
                      className={cn(
                        "w-full justify-start text-gray-300 hover:text-white hover:bg-white/10",
                        isActive("/admin/administracion") && "text-white bg-white/10"
                      )}
                    >
                      <Building2 className="w-4 h-4 mr-2" />
                      Administración
                    </EnhancedButton>
                  </Link>
                  <div className="w-full">
                    <EnhancedButton
                      variant="ghost"
                      className={cn(
                        "w-full justify-between text-gray-300 hover:text-white hover:bg-white/10",
                        workforceOpen && "text-white bg-white/10"
                      )}
                      onClick={() => setWorkforceOpen((prev) => !prev)}
                    >
                      <span className="flex items-center">
                        <Users className="w-4 h-4 mr-2" />
                        WorkForce
                      </span>
                      <span className="text-xs">{workforceOpen ? "−" : "+"}</span>
                    </EnhancedButton>
                    {workforceOpen && (
                      <div className="ml-4 mt-1 space-y-1">
                        <Link href="/admin/reportes/bi-dashboard" className="block" onClick={() => { setMobileMenuOpen(false); setWorkforceOpen(false); }}>
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
                        <Link href="/admin/turnos" className="block" onClick={() => { setMobileMenuOpen(false); setWorkforceOpen(false); }}>
                          <EnhancedButton 
                            variant="ghost" 
                            className={cn(
                              "w-full justify-start text-gray-300 hover:text-white hover:bg-white/10",
                              isActive("/admin/turnos") && "text-white bg-white/10"
                            )}
                          >
                            <Timer className="w-4 h-4 mr-2" />
                            Turnos
                          </EnhancedButton>
                        </Link>
                        <Link href="/admin/mapa" className="block" onClick={() => { setMobileMenuOpen(false); setWorkforceOpen(false); }}>
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
                        <Link href="/admin/reportes/tiempos-pedido" className="block" onClick={() => { setMobileMenuOpen(false); setWorkforceOpen(false); }}>
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
                        <Link href="/admin/rutas" className="block" onClick={() => { setMobileMenuOpen(false); setWorkforceOpen(false); }}>
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
                        <Link href="/admin/reportes" className="block" onClick={() => { setMobileMenuOpen(false); setWorkforceOpen(false); }}>
                          <EnhancedButton 
                            variant="ghost" 
                            className={cn(
                              "w-full justify-start text-gray-300 hover:text-white hover:bg-white/10",
                              isActive("/admin/reportes") && !isActive("/admin/reportes/bi-dashboard") && !isActive("/admin/reportes/tiempos-pedido") && "text-white bg-white/10"
                            )}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Reportes Pivot
                          </EnhancedButton>
                        </Link>
                      </div>
                    )}
                  </div>
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
                <>
                  <Link href="/armador" className="block" onClick={() => setMobileMenuOpen(false)}>
                    <EnhancedButton 
                      variant="ghost" 
                      className={cn(
                        "w-full justify-start text-gray-300 hover:text-white hover:bg-white/10",
                        isActive("/armador") && !isActive("/armador/calendario") && "text-white bg-white/10"
                      )}
                    >
                      <Home className="w-4 h-4 mr-2" />
                      Mis Órdenes
                    </EnhancedButton>
                  </Link>
                  <Link href="/armador/calendario" className="block" onClick={() => setMobileMenuOpen(false)}>
                    <EnhancedButton 
                      variant="ghost" 
                      className={cn(
                        "w-full justify-start text-gray-300 hover:text-white hover:bg-white/10",
                        isActive("/armador/calendario") && "text-white bg-white/10"
                      )}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Calendario
                    </EnhancedButton>
                  </Link>
                </>
              )}

              {/* Enlaces comunes para todos */}
              <div className="border-t border-gray-700 mt-2 pt-2 space-y-1">
                {user.rol !== "ARMADOR" && (
                  <Link href="/admin/perfil" className="block" onClick={() => setMobileMenuOpen(false)}>
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
                    <Link href="/admin/configuracion/facturacion" className="block" onClick={() => setMobileMenuOpen(false)}>
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
                    <Link href="/admin/configuracion/geomaps" className="block" onClick={() => setMobileMenuOpen(false)}>
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
                  className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 rounded-md"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
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
