"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: 'url("https://images.unsplash.com/photo-1490682143684-14369e18dce8?q=80&w=2070&auto=format&fit=crop")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay oscuro para que el fondo no compita tanto con el texto */}
      <div className="absolute inset-0 bg-black/20"></div>

      <div className="w-full max-w-md p-10 rounded-[20px] bg-white/10 backdrop-blur-md border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] relative overflow-hidden z-10 transition-all duration-300">
        
        <div className="relative z-10 space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-white tracking-wide">LOGIN</h1>
            <p className="text-white/80 font-medium">Armados 2Go</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 mt-8">
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-white px-4 py-3 rounded-lg text-sm text-center backdrop-blur-sm animate-pulse">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label htmlFor="email" className="text-sm font-medium text-cyan-400 capitalize tracking-wide flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Correo Electrónico
              </label>
              <div className="relative border-b border-white/30 focus-within:border-cyan-400 transition-colors">
                <Input
                  id="email"
                  type="email"
                  placeholder="Administrador o Usuario"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full bg-transparent border-0 px-0 py-2 pt-3 text-white text-lg placeholder:text-white/40 focus-visible:ring-0 focus-visible:-offset-0 shadow-none ring-0 focus:ring-0"
                  style={{ boxShadow: 'none' }}
                />
              </div>
            </div>

            <div className="space-y-1 mt-6">
              <label htmlFor="password" className="text-sm font-medium text-white/70 capitalize tracking-wide flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Contraseña
              </label>
              <div className="relative border-b border-white/30 focus-within:border-cyan-400 transition-colors">
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full bg-transparent border-0 px-0 py-2 pt-3 text-white text-lg placeholder:text-white/40 focus-visible:ring-0 focus-visible:-offset-0 shadow-none ring-0 focus:ring-0"
                  style={{ boxShadow: 'none' }}
                />
              </div>
            </div>

            <div className="pt-4">
              <Button 
                className="w-full bg-[#1da1f2] hover:bg-[#1a8cd3] text-white font-bold py-6 rounded-lg transition-all duration-300 transform active:scale-[0.98] shadow-[0_4px_14px_0_rgba(29,161,242,0.39)] hover:shadow-[0_6px_20px_rgba(29,161,242,0.23)] text-md tracking-wider" 
                type="submit"
                disabled={loading}
              >
                {loading ? "CARGANDO..." : "SIGN IN"}
              </Button>
            </div>
          </form>

          <div className="mt-8 pt-4 text-center">
             <span className="text-white/70 text-sm font-medium">¿Nuevo por aquí o necesitas ayuda? </span>
             <Link href="/" className="text-[#1da1f2] hover:text-[#71c9f8] hover:underline text-sm font-bold transition-colors">
               Volver al inicio
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}