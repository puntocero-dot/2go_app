"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

interface LoginFormProps {
  backgroundUrl: string;
}

export function LoginForm({ backgroundUrl }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error al iniciar sesión");
        setLoading(false);
        return;
      }

      // Redirigir según el rol
      switch (data.user.rol) {
        case "ADMIN":
          router.push("/admin");
          break;
        case "SUPERVISOR":
          router.push("/supervisor");
          break;
        case "ARMADOR":
          router.push("/armador");
          break;
        default:
          router.push("/");
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* CSS estricto para anular el fondo blanco del auto-completado de Chrome.
          Específico para el login: box-shadow inset con color semi-transparente
          que armoniza con el container glass del card (bg-white/10). */}
      <style dangerouslySetInnerHTML={{__html: `
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
            transition: background-color 5000s ease-in-out 0s !important;
            -webkit-text-fill-color: white !important;
            caret-color: white !important;
            -webkit-box-shadow: 0 0 0 1000px rgba(15, 23, 42, 0.35) inset !important;
            box-shadow: 0 0 0 1000px rgba(15, 23, 42, 0.35) inset !important;
        }
      `}} />

      {/* Imagen de fondo, editable desde /admin/configuracion/login.
          sizes="100vw" evita que Next elija un candidato de srcset más
          chico de lo necesario para un fondo a pantalla completa. */}
      <Image
        src={backgroundUrl}
        alt="Fondo"
        fill
        priority
        sizes="100vw"
        quality={90}
        className="object-cover z-0"
      />

      {/* Overlay oscuro para la legibilidad. Como el fondo es editable desde
          admin (puede ser cualquier foto), subimos la opacidad para que
          objetos de bordes marcados en la imagen (mesas, tablas, etc.) no
          se noten como siluetas rectangulares a través de la tarjeta. */}
      <div className="absolute inset-0 bg-black/50 z-0"></div>

      <div className="w-full max-w-md p-10 rounded-[32px] bg-white/[0.14] backdrop-blur-3xl border border-white/20 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)] overflow-hidden relative z-10 transition-all duration-300">

        <div className="relative z-10 space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-white tracking-wide">LOGIN</h1>
            <p className="text-white/80 font-medium">Armados 2Go</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 mt-8">
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-white px-4 py-3 rounded-full text-sm text-center backdrop-blur-sm animate-pulse">
                {error}
              </div>
            )}

            <div className="relative flex items-center rounded-full border border-white/30 bg-white/5 focus-within:border-white/70 transition-colors">
              <Mail className="absolute left-4 h-5 w-5 text-white/60" />
              <input
                id="email"
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full bg-transparent border-none outline-none pl-12 pr-4 py-3.5 text-white placeholder:text-white/60 focus:ring-0 shadow-none appearance-none"
                autoComplete="email"
              />
            </div>

            <div className="relative flex items-center rounded-full border border-white/30 bg-white/5 focus-within:border-white/70 transition-colors">
              <Lock className="absolute left-4 h-5 w-5 text-white/60" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full bg-transparent border-none outline-none pl-12 pr-12 py-3.5 text-white placeholder:text-white/60 focus:ring-0 shadow-none appearance-none"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                className="absolute right-4 text-white/60 hover:text-white transition-colors"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1f9d7c] hover:bg-[#1b8a6c] text-white font-bold py-4 rounded-full transition-all duration-300 transform active:scale-[0.98] shadow-[0_4px_14px_0_rgba(31,157,124,0.39)] hover:shadow-[0_6px_20px_rgba(31,157,124,0.4)] tracking-wider flex items-center justify-center disabled:opacity-50"
              >
                {loading ? "CARGANDO..." : "INICIAR SESIÓN"}
              </button>
            </div>
          </form>

          <div className="pt-2 text-center space-y-3">
             <div>
               <span className="text-white/70 text-sm font-medium">¿Nuevo aquí? </span>
               <Link href="/" className="text-white hover:text-white/80 hover:underline text-sm font-bold transition-colors">
                 Contacta a tu administrador
               </Link>
             </div>
             <div className="flex items-center justify-center gap-4 text-xs text-white/40">
               <Link href="/terminos" className="hover:text-white/70 transition-colors">Términos</Link>
               <Link href="/privacidad" className="hover:text-white/70 transition-colors">Privacidad</Link>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
