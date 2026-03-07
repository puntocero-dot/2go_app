import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  Truck, 
  BarChart3, 
  Shield, 
  Clock, 
  Users, 
  Smartphone,
  CheckCircle2,
  ArrowRight,
  Zap,
  Globe,
  FileText,
  Bell,
  Route
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Armados 2Go</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-600 hover:text-gray-900 transition">Características</a>
            <a href="#tracking" className="text-gray-600 hover:text-gray-900 transition">Tracking</a>
            <a href="#portal" className="text-gray-600 hover:text-gray-900 transition">Portal Clientes</a>
            <a href="#benefits" className="text-gray-600 hover:text-gray-900 transition">Beneficios</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/orden/seguimiento">
              <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                Seguir Pedido
              </Button>
            </Link>
            <Link href="/login">
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white">
                Iniciar Sesión
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-cyan-300 text-sm mb-6">
              <Zap className="w-4 h-4" />
              Plataforma líder en gestión de servicios de armado
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Tracking y Gestión
              <span className="block bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                en Tiempo Real
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
              Optimiza tus operaciones de armado de muebles con seguimiento GPS, 
              asignación inteligente y un portal completo para tus clientes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-cyan-500/25">
                  Acceder al Sistema
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/orden/seguimiento">
                <Button size="lg" variant="outline" className="bg-white/5 hover:bg-white/10 text-white border-white/20 px-8 py-6 text-lg rounded-xl backdrop-blur-sm">
                  <MapPin className="w-5 h-5 mr-2" />
                  Rastrear mi Pedido
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 max-w-4xl mx-auto">
            {[
              { value: "99.9%", label: "Uptime garantizado" },
              { value: "< 5s", label: "Actualización GPS" },
              { value: "24/7", label: "Soporte disponible" },
              { value: "100%", label: "Datos en la nube" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Todo lo que necesitas en una plataforma
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Herramientas poderosas para gestionar cada aspecto de tus operaciones de armado
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: MapPin,
                title: "Tracking GPS en Tiempo Real",
                description: "Visualiza la ubicación exacta de tus armadores con actualizaciones cada 5 segundos. Historial completo de rutas.",
                color: "from-cyan-500 to-blue-500"
              },
              {
                icon: Route,
                title: "Comparación de Rutas",
                description: "Compara la ruta real vs la ruta óptima. Detecta desviaciones y optimiza tiempos de entrega.",
                color: "from-emerald-500 to-teal-500"
              },
              {
                icon: Users,
                title: "Gestión de Armadores",
                description: "Administra tu equipo, turnos, disponibilidad y rendimiento desde un panel centralizado.",
                color: "from-violet-500 to-purple-500"
              },
              {
                icon: BarChart3,
                title: "Reportes y Analytics",
                description: "Dashboards con KPIs, tiempos de armado, productividad y facturación en tiempo real.",
                color: "from-orange-500 to-red-500"
              },
              {
                icon: Bell,
                title: "Notificaciones Automáticas",
                description: "Alertas por WhatsApp y email para clientes y supervisores en cada cambio de estado.",
                color: "from-pink-500 to-rose-500"
              },
              {
                icon: FileText,
                title: "Facturación Integrada",
                description: "Genera facturas automáticas basadas en reglas de cobro personalizadas por proyecto.",
                color: "from-amber-500 to-yellow-500"
              },
            ].map((feature, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tracking Section */}
      <section id="tracking" className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-cyan-50 text-cyan-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <MapPin className="w-4 h-4" />
                Sistema de Tracking Avanzado
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Seguimiento GPS de alta precisión
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Monitorea cada movimiento de tu flota de armadores con tecnología GPS de última generación. 
                Visualiza rutas en tiempo real y compara con la ruta óptima sugerida.
              </p>
              <ul className="space-y-4">
                {[
                  "Actualización de ubicación cada 5 segundos",
                  "Historial completo de rutas recorridas",
                  "Detección automática de desviaciones",
                  "ETA dinámico basado en tráfico real",
                  "Alertas de llegada para clientes",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 shadow-2xl">
                <div className="bg-slate-700/50 rounded-2xl p-6 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white font-medium">Ruta del Armador</span>
                    <span className="text-emerald-400 text-sm flex items-center gap-1">
                      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                      En vivo
                    </span>
                  </div>
                  <div className="h-48 bg-slate-600/50 rounded-xl flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/20"></div>
                    <div className="text-center z-10">
                      <Globe className="w-12 h-12 text-cyan-400 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">Mapa interactivo con Mapbox</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-700/50 rounded-xl p-4">
                    <p className="text-gray-400 text-xs mb-1">Distancia recorrida</p>
                    <p className="text-white text-xl font-bold">12.4 km</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-xl p-4">
                    <p className="text-gray-400 text-xs mb-1">ETA estimado</p>
                    <p className="text-white text-xl font-bold">15 min</p>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full blur-3xl opacity-30"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Portal Clientes Section */}
      <section id="portal" className="py-24 bg-gradient-to-br from-cyan-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Portal de Seguimiento</h4>
                    <p className="text-sm text-gray-500">Acceso público para clientes</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { status: "Completado", label: "Pedido confirmado", time: "10:30 AM" },
                    { status: "Completado", label: "Armador asignado", time: "10:45 AM" },
                    { status: "Completado", label: "En camino", time: "11:00 AM" },
                    { status: "Activo", label: "Armado en proceso", time: "11:30 AM" },
                    { status: "Pendiente", label: "Completado", time: "---" },
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        step.status === "Completado" ? "bg-emerald-100" :
                        step.status === "Activo" ? "bg-cyan-100" : "bg-gray-100"
                      }`}>
                        {step.status === "Completado" ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : step.status === "Activo" ? (
                          <div className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse" />
                        ) : (
                          <div className="w-3 h-3 bg-gray-300 rounded-full" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${step.status === "Pendiente" ? "text-gray-400" : "text-gray-900"}`}>
                          {step.label}
                        </p>
                      </div>
                      <span className="text-sm text-gray-500">{step.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Users className="w-4 h-4" />
                Portal de Clientes
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Transparencia total para tus clientes
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Ofrece a tus clientes un portal de seguimiento donde pueden ver el estado 
                de su pedido en tiempo real, sin necesidad de llamar o escribir.
              </p>
              <ul className="space-y-4">
                {[
                  "Acceso con código de pedido (sin registro)",
                  "Estado actualizado en tiempo real",
                  "Información del armador asignado",
                  "Notificaciones automáticas por WhatsApp",
                  "Historial completo del servicio",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/orden/seguimiento" className="inline-block mt-8">
                <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl">
                  Probar Portal de Seguimiento
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              ¿Por qué elegir Armados 2Go?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              La plataforma más completa para empresas de armado de muebles
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Shield,
                title: "Seguridad Enterprise",
                description: "Datos encriptados, autenticación JWT y auditoría completa de acciones."
              },
              {
                icon: Clock,
                title: "Ahorra Tiempo",
                description: "Automatiza asignaciones, facturación y notificaciones. Menos trabajo manual."
              },
              {
                icon: BarChart3,
                title: "Decisiones con Datos",
                description: "Reportes detallados de productividad, tiempos y costos operativos."
              },
              {
                icon: Smartphone,
                title: "100% Responsive",
                description: "Funciona perfecto en móvil, tablet y desktop. PWA disponible."
              },
            ].map((benefit, i) => (
              <div key={i} className="text-center p-6">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <benefit.icon className="w-8 h-8 text-cyan-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600 text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            ¿Listo para optimizar tus operaciones?
          </h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Únete a las empresas que ya confían en Armados 2Go para gestionar sus servicios de armado.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="bg-white text-slate-900 hover:bg-gray-100 px-8 py-6 text-lg rounded-xl">
                Comenzar Ahora
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/orden/seguimiento">
              <Button size="lg" variant="outline" className="bg-transparent hover:bg-white/10 text-white border-white/30 px-8 py-6 text-lg rounded-xl">
                Ver Demo de Seguimiento
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-gray-400 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-semibold">Armados 2Go</span>
            </div>
            <p className="text-sm">
              © {new Date().getFullYear()} Armados 2Go. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/login" className="hover:text-white transition">Iniciar Sesión</Link>
              <Link href="/orden/seguimiento" className="hover:text-white transition">Seguir Pedido</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
