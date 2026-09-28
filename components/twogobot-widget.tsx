"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Mensaje {
  rol: "usuario" | "bot";
  texto: string;
}

const MENSAJE_BIENVENIDA: Mensaje = {
  rol: "bot",
  texto:
    "Hola, soy 2GoBot 👋 Puedo contarte cómo funciona el servicio de armado de muebles RTA y melamina de Armados 2Go, o agendarte una cita con nuestro equipo comercial. ¿En qué te ayudo?",
};

export function TwoGoBotWidget() {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([MENSAJE_BIENVENIDA]);
  const [entrada, setEntrada] = useState("");
  const [cargando, setCargando] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [mensajes, abierto]);

  const enviar = async () => {
    const texto = entrada.trim();
    if (!texto || cargando) return;

    const historial = mensajes;
    setMensajes((prev) => [...prev, { rol: "usuario", texto }]);
    setEntrada("");
    setCargando(true);

    try {
      const res = await fetch("/api/chat/2gobot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensaje: texto, historial }),
      });

      if (!res.ok) {
        throw new Error("respuesta no ok");
      }

      const data = await res.json();
      setMensajes((prev) => [
        ...prev,
        { rol: "bot", texto: data.respuesta || "No pude procesar tu mensaje, intenta de nuevo." },
      ]);
    } catch {
      setMensajes((prev) => [
        ...prev,
        {
          rol: "bot",
          texto: "Tuvimos un problema de conexión. Intenta de nuevo en unos momentos.",
        },
      ]);
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      {abierto && (
        <div className="fixed bottom-24 right-4 z-50 flex h-[28rem] w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#140f0a] shadow-2xl shadow-black/40 sm:right-6">
          <div className="flex items-center justify-between border-b border-white/10 bg-primary/10 px-4 py-3">
            <div>
              <p className="font-display text-sm font-semibold text-white">2GoBot</p>
              <p className="text-xs text-white/50">Asistente de Armados 2Go</p>
            </div>
            <button
              onClick={() => setAbierto(false)}
              aria-label="Cerrar chat"
              className="rounded-full p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {mensajes.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                  m.rol === "usuario"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-white/[0.06] text-white/85"
                )}
              >
                {m.texto}
              </div>
            ))}
            {cargando && (
              <div className="flex items-center gap-2 text-xs text-white/40">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Escribiendo...
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 border-t border-white/10 p-3">
            <input
              value={entrada}
              onChange={(e) => setEntrada(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  enviar();
                }
              }}
              placeholder="Escribe tu mensaje..."
              maxLength={2000}
              className="flex-1 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white placeholder:text-white/30 focus:border-primary focus:outline-none"
            />
            <button
              onClick={enviar}
              disabled={cargando || !entrada.trim()}
              aria-label="Enviar mensaje"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setAbierto((v) => !v)}
        aria-label={abierto ? "Cerrar 2GoBot" : "Abrir 2GoBot"}
        className="fixed bottom-6 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-105 sm:right-6"
      >
        {abierto ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </>
  );
}
