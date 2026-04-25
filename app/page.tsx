"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  MapPin, Truck, BarChart3, Shield, Clock, Users,
  Smartphone, CheckCircle2, ArrowRight, Zap, Globe,
  FileText, Bell, Route
} from "lucide-react";

const HeroScene = dynamic(() => import("@/components/hero-scene"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-900 via-blue-950 to-cyan-950" />
  ),
});

function useInView(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsInView(true); },
      { threshold: 0.1, ...options }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { ref, isInView };
}

function CountUp({ target, suffix = "", duration = 2000 }: { target: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const { ref, isInView } = useInView();

  useEffect(() => {
    if (!isInView) return;
    const start = Date.now();
    const step = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isInView, target, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, isInView } = useInView();
  return (
    <div
      ref={ref}
      className={`fade-up ${isInView ? "visible" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

const FEATURES = [
  {
    icon: MapPin,
    title: "Tracking GPS en Tiempo Real",
    description: "Visualiza la ubicación exacta de tus armadores con actualizaciones cada 5 segundos. Historial completo de rutas.",
    accent: "text-cyan-400",
    glow: "from-cyan-500/20 to-blue-500/20",
    border: "group-hover:border-cyan-500/40",
  },
  {
    icon: Route,
    title: "Comparación de Rutas",
    description: "Compara la ruta real vs la ruta óptima. Detecta desviaciones y optimiza tiempos de entrega.",
    accent: "text-emerald-400",
    glow: "from-emerald-500/20 to-teal-500/20",
    border: "group-hover:border-emerald-500/40",
  },
  {
    icon: Users,
    title: "Gestión de Armadores",
    description: "Administra tu equipo, turnos, disponibilidad y rendimiento desde un panel centralizado.",
    accent: "text-violet-400",
    glow: "from-violet-500/20 to-purple-500/20",
    border: "group-hover:border-violet-500/40",
  },
  {
    icon: BarChart3,
    title: "Reportes y Analytics",
    description: "Dashboards con KPIs, tiempos de armado, productividad y facturación en tiempo real.",
    accent: "text-orange-400",
    glow: "from-orange-500/20 to-red-500/20",
    border: "group-hover:border-orange-500/40",
  },
  {
    icon: Bell,
    title: "Notificaciones Automáticas",
    description: "Alertas por WhatsApp y email para clientes y supervisores en cada cambio de estado.",
    accent: "text-pink-400",
    glow: "from-pink-500/20 to-rose-500/20",
    border: "group-hover:border-pink-500/40",
  },
  {
    icon: FileText,
    title: "Facturación Integrada",
    description: "Genera facturas automáticas basadas en reglas de cobro personalizadas por proyecto.",
    accent: "text-amber-400",
    glow: "from-amber-500/20 to-yellow-500/20",
    border: "group-hover:border-amber-500/40",
  },
];

const CHECKLIST_TRACKING = [
  "Actualización de ubicación cada 5 segundos",
  "Historial completo de rutas recorridas",
  "Detección automática de desviaciones",
  "ETA dinámico basado en tráfico real",
  "Alertas de llegada para clientes",
];

const CHECKLIST_PORTAL = [
  "Acceso con código de pedido (sin registro)",
  "Estado actualizado en tiempo real",
  "Información del armador asignado",
  "Notificaciones automáticas por WhatsApp",
  "Historial completo del servicio",
];

const BENEFITS = [
  { icon: Shield, title: "Seguridad Enterprise", description: "Datos encriptados, autenticación JWT y auditoría completa de acciones." },
  { icon: Clock, title: "Ahorra Tiempo", description: "Automatiza asignaciones, facturación y notificaciones. Menos trabajo manual." },
  { icon: BarChart3, title: "Decisiones con Datos", description: "Reportes detallados de productividad, tiempos y costos operativos." },
  { icon: Smartphone, title: "100% Responsive", description: "Funciona perfecto en móvil, tablet y desktop. PWA disponible." },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#06090f]">
      <style jsx global>{`
        @keyframes gradient { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        .animate-gradient { animation: gradient 4s ease infinite; }
        .fade-up { opacity: 0; transform: translateY(20px); transition: all 0.65s cubic-bezier(0.16, 1, 0.3, 1); }
        .fade-up.visible { opacity: 1; transform: translateY(0); }
      `}</style>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#06090f]/80 backdrop-blur-xl border-b border-white/[0.07]">
        <div className="container mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#1da1f2] rounded-xl flex items-center justify-center shadow-[0_0_12px_rgba(29,161,242,0.4)]">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">Armados 2Go</span>
          </div>

          <div className="hidden md:flex items-center gap-7">
            {["#features", "#tracking", "#portal", "#benefits"].map((href, i) => (
              <a key={href} href={href} className="text-white/55 hover:text-white transition-colors text-sm font-medium">
                {["Características", "Tracking", "Portal Clientes", "Beneficios"][i]}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/orden/seguimiento">
              <Button variant="ghost" className="text-white/60 hover:text-white hover:bg-white/[0.07] text-sm">
                Seguir Pedido
              </Button>
            </Link>
            <Link href="/login">
              <Button className="bg-[#1da1f2] hover:bg-[#1a8cd3] text-white text-sm px-5 rounded-lg shadow-[0_4px_14px_rgba(29,161,242,0.35)] hover:shadow-[0_6px_20px_rgba(29,161,242,0.45)] transition-all">
                Iniciar Sesión
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-20 bg-gradient-to-br from-slate-900 via-blue-950 to-cyan-950 relative overflow-hidden min-h-[92vh] flex items-center">
        <HeroScene />
        <div className="absolute inset-0 z-[1] bg-gradient-to-b from-slate-900/50 via-transparent to-[#06090f]/90 pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <FadeUp>
              <div className="inline-flex items-center gap-2 bg-white/[0.08] backdrop-blur-md px-5 py-2 rounded-full text-cyan-300 text-sm mb-8 border border-white/[0.12]">
                <Zap className="w-3.5 h-3.5" />
                Plataforma líder en gestión de servicios de armado
              </div>
            </FadeUp>

            <FadeUp delay={100}>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-[1.05] tracking-tight">
                Tracking y Gestión
                <span className="block bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-[length:200%_auto] animate-gradient drop-shadow-[0_0_30px_rgba(6,182,212,0.25)]">
                  en Tiempo Real
                </span>
              </h1>
            </FadeUp>

            <FadeUp delay={200}>
              <p className="text-xl md:text-2xl text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed">
                Optimiza tus operaciones de armado de muebles con seguimiento GPS,
                asignación inteligente y un portal completo para tus clientes.
              </p>
            </FadeUp>

            <FadeUp delay={300}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/login">
                  <Button size="lg" className="bg-[#1da1f2] hover:bg-[#1a8cd3] text-white px-8 py-6 text-lg rounded-xl shadow-[0_6px_20px_rgba(29,161,242,0.4)] hover:shadow-[0_8px_28px_rgba(29,161,242,0.55)] transition-all hover:scale-105">
                    Acceder al Sistema
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/orden/seguimiento">
                  <Button size="lg" variant="outline" className="bg-white/[0.06] hover:bg-white/10 text-white border-white/15 px-8 py-6 text-lg rounded-xl backdrop-blur-sm transition-all hover:scale-105">
                    <MapPin className="w-5 h-5 mr-2" />
                    Rastrear mi Pedido
                  </Button>
                </Link>
              </div>
            </FadeUp>
          </div>

          {/* Stats */}
          <FadeUp delay={400}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 max-w-4xl mx-auto">
              {[
                { value: <><CountUp target={99} suffix=".9%" /></>, label: "Uptime garantizado", color: "text-white" },
                { value: <>{"< "}<CountUp target={5} suffix="s" /></>, label: "Actualización GPS", color: "text-white" },
                { value: <CountUp target={24} suffix="/7" />, label: "Soporte disponible", color: "text-cyan-400" },
                { value: <CountUp target={100} suffix="%" />, label: "Datos en la nube", color: "text-white" },
              ].map((stat, i) => (
                <div key={i} className="text-center bg-white/[0.05] backdrop-blur-sm rounded-2xl p-5 border border-white/[0.08]">
                  <div className={`text-3xl md:text-4xl font-bold mb-1 ${stat.color}`}>{stat.value}</div>
                  <div className="text-white/50 text-xs">{stat.label}</div>
                </div>
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-[#06090f] relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(29,161,242,0.04),transparent_70%)]" />
        <div className="container mx-auto px-4 relative">
          <FadeUp>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-cyan-500/10 text-cyan-400 px-4 py-1.5 rounded-full text-xs font-medium tracking-widest uppercase mb-4 border border-cyan-500/20">
                Funcionalidades
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Todo lo que necesitas en una plataforma
              </h2>
              <p className="text-white/50 max-w-xl mx-auto">
                Herramientas poderosas para gestionar cada aspecto de tus operaciones de armado
              </p>
            </div>
          </FadeUp>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feature, i) => (
              <FadeUp key={i} delay={i * 80}>
                <div className={`group relative bg-white/[0.04] rounded-2xl p-7 border border-white/[0.07] hover:border-white/15 transition-all duration-300 hover:bg-white/[0.06] hover:-translate-y-0.5 h-full overflow-hidden`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.glow} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl`} />
                  <div className="relative z-10">
                    <div className={`w-11 h-11 rounded-xl bg-white/[0.07] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className={`w-5 h-5 ${feature.accent}`} />
                    </div>
                    <h3 className="text-base font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-white/50 text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* Tracking */}
      <section id="tracking" className="py-24 bg-[#07090e] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/[0.04] rounded-full blur-3xl" />
        <div className="container mx-auto px-4 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <FadeUp>
              <div>
                <div className="inline-flex items-center gap-2 bg-cyan-500/10 text-cyan-400 px-4 py-1.5 rounded-full text-xs font-medium tracking-widest uppercase mb-6 border border-cyan-500/20">
                  <MapPin className="w-3.5 h-3.5" />
                  Sistema de Tracking
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-5">
                  Seguimiento GPS de alta precisión
                </h2>
                <p className="text-white/50 mb-8 leading-relaxed">
                  Monitorea cada movimiento de tu flota de armadores con tecnología GPS de última generación.
                  Visualiza rutas en tiempo real y compara con la ruta óptima sugerida.
                </p>
                <ul className="space-y-3.5">
                  {CHECKLIST_TRACKING.map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <span className="text-white/70 text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeUp>

            <FadeUp delay={150}>
              <div className="relative">
                <div className="bg-white/[0.04] backdrop-blur-sm rounded-3xl p-7 border border-white/[0.08] shadow-2xl">
                  <div className="bg-white/[0.04] rounded-2xl p-5 mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-white text-sm font-medium">Ruta del Armador</span>
                      <span className="text-emerald-400 text-xs flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                        En vivo
                      </span>
                    </div>
                    <div className="h-44 bg-white/[0.03] rounded-xl flex items-center justify-center relative overflow-hidden border border-white/[0.05]">
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10" />
                      <div className="text-center z-10">
                        <Globe className="w-10 h-10 text-cyan-400/60 mx-auto mb-2" />
                        <p className="text-white/30 text-xs">Mapa interactivo con Mapbox</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.06]">
                      <p className="text-white/40 text-xs mb-1">Distancia recorrida</p>
                      <p className="text-white text-xl font-bold">12.4 km</p>
                    </div>
                    <div className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.06]">
                      <p className="text-white/40 text-xs mb-1">ETA estimado</p>
                      <p className="text-white text-xl font-bold">15 min</p>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-8 -right-8 w-36 h-36 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full blur-3xl opacity-15" />
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* Portal Clientes */}
      <section id="portal" className="py-24 bg-[#06090f] relative">
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/[0.04] rounded-full blur-3xl" />
        <div className="container mx-auto px-4 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <FadeUp delay={150} className="order-2 lg:order-1">
              <div className="bg-white/[0.04] rounded-3xl p-7 border border-white/[0.08]">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-11 h-11 bg-[#1da1f2]/20 rounded-xl flex items-center justify-center border border-[#1da1f2]/30">
                    <Smartphone className="w-5 h-5 text-[#1da1f2]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-sm">Portal de Seguimiento</h4>
                    <p className="text-xs text-white/40">Acceso público para clientes</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { status: "done", label: "Pedido confirmado", time: "10:30 AM" },
                    { status: "done", label: "Armador asignado", time: "10:45 AM" },
                    { status: "done", label: "En camino", time: "11:00 AM" },
                    { status: "active", label: "Armado en proceso", time: "11:30 AM" },
                    { status: "pending", label: "Completado", time: "—" },
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-3.5 py-1">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                        step.status === "done" ? "bg-emerald-500/20 border border-emerald-500/30" :
                        step.status === "active" ? "bg-cyan-500/20 border border-cyan-500/30" :
                        "bg-white/[0.05] border border-white/10"
                      }`}>
                        {step.status === "done" ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : step.status === "active" ? (
                          <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-pulse" />
                        ) : (
                          <div className="w-2.5 h-2.5 bg-white/20 rounded-full" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${step.status === "pending" ? "text-white/25" : "text-white/80"}`}>
                          {step.label}
                        </p>
                      </div>
                      <span className="text-xs text-white/30">{step.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeUp>

            <FadeUp delay={0} className="order-1 lg:order-2">
              <div>
                <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 px-4 py-1.5 rounded-full text-xs font-medium tracking-widest uppercase mb-6 border border-blue-500/20">
                  <Users className="w-3.5 h-3.5" />
                  Portal de Clientes
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-5">
                  Transparencia total para tus clientes
                </h2>
                <p className="text-white/50 mb-8 leading-relaxed">
                  Ofrece a tus clientes un portal de seguimiento donde pueden ver el estado
                  de su pedido en tiempo real, sin necesidad de llamar o escribir.
                </p>
                <ul className="space-y-3.5">
                  {CHECKLIST_PORTAL.map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                      <span className="text-white/70 text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/orden/seguimiento" className="inline-block mt-8">
                  <Button className="bg-[#1da1f2] hover:bg-[#1a8cd3] text-white rounded-xl shadow-[0_4px_14px_rgba(29,161,242,0.35)] hover:shadow-[0_6px_20px_rgba(29,161,242,0.45)] transition-all">
                    Probar Portal de Seguimiento
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="py-24 bg-[#07090e]">
        <div className="container mx-auto px-4">
          <FadeUp>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-violet-500/10 text-violet-400 px-4 py-1.5 rounded-full text-xs font-medium tracking-widest uppercase mb-4 border border-violet-500/20">
                Ventajas
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                ¿Por qué elegir Armados 2Go?
              </h2>
              <p className="text-white/50 max-w-xl mx-auto">
                La plataforma más completa para empresas de armado de muebles
              </p>
            </div>
          </FadeUp>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {BENEFITS.map((benefit, i) => (
              <FadeUp key={i} delay={i * 80}>
                <div className="group text-center p-7 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/12 transition-all duration-300 hover:-translate-y-0.5">
                  <div className="w-14 h-14 bg-white/[0.06] rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300">
                    <benefit.icon className="w-7 h-7 text-cyan-400" />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">{benefit.title}</h3>
                  <p className="text-white/45 text-sm leading-relaxed">{benefit.description}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-[#0a1020] via-blue-950/80 to-cyan-950/60 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(29,161,242,0.08),transparent_70%)]" />
        <div className="container mx-auto px-4 text-center relative">
          <FadeUp>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-5">
              ¿Listo para optimizar tus operaciones?
            </h2>
            <p className="text-white/50 mb-10 max-w-xl mx-auto">
              Únete a las empresas que ya confían en Armados 2Go para gestionar sus servicios de armado.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button size="lg" className="bg-[#1da1f2] hover:bg-[#1a8cd3] text-white px-8 py-6 text-base rounded-xl shadow-[0_6px_20px_rgba(29,161,242,0.4)] hover:shadow-[0_8px_28px_rgba(29,161,242,0.55)] transition-all hover:scale-105">
                  Comenzar Ahora
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/orden/seguimiento">
                <Button size="lg" variant="outline" className="bg-white/[0.05] hover:bg-white/[0.09] text-white border-white/15 px-8 py-6 text-base rounded-xl backdrop-blur-sm transition-all hover:scale-105">
                  Ver Demo de Seguimiento
                </Button>
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#04060c] border-t border-white/[0.06] text-white/40 py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-[#1da1f2] rounded-lg flex items-center justify-center">
                <Truck className="w-4 h-4 text-white" />
              </div>
              <span className="text-white/70 font-semibold text-sm">Armados 2Go</span>
            </div>
            <p className="text-xs">
              © {new Date().getFullYear()} Armados 2Go. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-6 text-xs">
              <Link href="/login" className="hover:text-white transition-colors">Iniciar Sesión</Link>
              <Link href="/orden/seguimiento" className="hover:text-white transition-colors">Seguir Pedido</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
