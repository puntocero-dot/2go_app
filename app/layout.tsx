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

const SITE_URL = "https://www.armados2go.com";
const SITE_TITLE = "Armados 2Go — Armado de muebles RTA y melamina para retailers en El Salvador";
const SITE_DESCRIPTION =
  "Servicio profesional de armado (ensamble) de muebles RTA y de melamina para tiendas y retailers en El Salvador. Tracking GPS en tiempo real, portal de seguimiento para clientes finales y gestión completa de armadores.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | Armados 2Go",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "armado de muebles El Salvador",
    "ensamble de muebles RTA",
    "armado de muebles de melamina",
    "servicio de armado para retailers",
    "instalación de mobiliario RTA",
    "armadores de muebles El Salvador",
    "tracking GPS armado de muebles",
    "outsourcing de ensamblaje de muebles",
  ],
  manifest: "/manifest.json",
  applicationName: "Armados 2Go",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "2Go",
  },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: "es_SV",
    url: SITE_URL,
    siteName: "Armados 2Go",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "Armados 2Go",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/icon-512.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
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
