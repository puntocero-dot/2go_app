import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { RegisterServiceWorker } from "./register-sw";

const inter = Inter({ subsets: ["latin"] });

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
  themeColor: "#8B6F47",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <RegisterServiceWorker />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
