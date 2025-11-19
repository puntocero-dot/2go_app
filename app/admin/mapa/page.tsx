'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Importar el mapa dinámicamente para evitar SSR
const MapaArmadores = dynamic(
  () => import("@/components/mapa-armadores").then((mod) => mod.MapaArmadores),
  { ssr: false }
);

type Usuario = {
  nombre: string;
  email: string;
  rol: "ADMIN" | "SUPERVISOR" | "ARMADOR";
};

export default function MapaPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const obtenerUsuario = async () => {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });

        if (!response.ok) {
          router.push("/login");
          return;
        }

        const data = await response.json();
        const user = data.user as Usuario;

        if (!user || !["ADMIN", "SUPERVISOR"].includes(user.rol)) {
          router.push("/login");
          return;
        }

        setUsuario(user);
      } catch (error) {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    obtenerUsuario();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">Cargando mapa...</p>
      </div>
    );
  }

  if (!usuario) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={usuario} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-deep-navy">
            Tracking GPS en Tiempo Real
          </h1>
          <p className="text-gray-600 mt-2">
            Visualiza la ubicación de todos los armadores activos
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Mapa de Armadores</CardTitle>
          </CardHeader>
          <CardContent>
            <MapaArmadores />
          </CardContent>
        </Card>

        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            ℹ️ El mapa se actualiza automáticamente cada 30 segundos. Los armadores
            actualizan su ubicación desde la app móvil.
          </p>
        </div>
      </main>
    </div>
  );
}