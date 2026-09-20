import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Fraunces } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { RegisterServiceWorker } from "./register-sw";
import { OnlineStatusIndicator } from "@/components/online-status-indicator";

// Plus Jakarta Sans reemplaza a Inter como tipografía de interfaz: métricas
// similares (no rompe densidad de tablas/formularios admin) pero con más
// carácter que la fuente por defecto de cualquier plantilla genérica.
const bodyFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

// Fraunces (soft-serif editorial) para titulares grandes: login, landing,
// encabezados de sección. Le da una identidad cálida y "de marca" en vez
// del look "SaaS genérico" de un solo sans-serif para todo.
const displayFont = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  axes: ["opsz", "SOFT", "WONK"],
});

export const metadata: Metadata = {
  title: "Armados 2Go",
  description:
    "Sistema de gestión de armado de muebles para empresas retail",
  manifest: "/manifest.json",
  applicationName: "Armados 2Go",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "2Go",
  },
  openGraph: {
    type: "website",
    siteName: "Armados 2Go",
    title: "Armados 2Go - Sistema de Gestión de Armado de Muebles",
    description:
      "Plataforma integral para la gestión de servicios de armado de muebles para empresas retail",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#2db28c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className={`${bodyFont.variable} ${displayFont.variable}`}>
      <body className={bodyFont.className}>
        <RegisterServiceWorker />
        {children}
        <Toaster />
        <OnlineStatusIndicator />
      </body>
    </html>
  );
}
