import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface LegalPageShellProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

/**
 * Layout compartido para páginas legales públicas (/terminos, /privacidad).
 * Tipografía simple sobre el fondo dark-glass del resto del sitio —
 * no se instaló @tailwindcss/typography, así que el espaciado de
 * secciones se controla manualmente vía las clases de esta shell.
 */
export function LegalPageShell({ title, lastUpdated, children }: LegalPageShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-white/[0.06] bg-[#04060c]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>
          <div className="flex items-center gap-4 text-xs text-white/40">
            <Link href="/terminos" className="hover:text-white transition-colors">
              Términos
            </Link>
            <Link href="/privacidad" className="hover:text-white transition-colors">
              Privacidad
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold text-gradient-cyan mb-2">
          {title}
        </h1>
        <p className="text-sm text-white/40 mb-10">
          Última actualización: {lastUpdated}
        </p>

        <div className="legal-content space-y-8 text-white/75 leading-relaxed">
          {children}
        </div>
      </main>

      <footer className="border-t border-white/[0.06] py-8 mt-8">
        <div className="container mx-auto px-4 text-center text-xs text-white/30">
          © {new Date().getFullYear()} Armados 2Go — Punto Cero S.A.S. de C.V.
        </div>
      </footer>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-white mb-3">{title}</h2>
      <div className="space-y-3 text-[15px]">{children}</div>
    </section>
  );
}
