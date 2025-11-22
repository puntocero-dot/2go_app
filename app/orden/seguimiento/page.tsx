"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SeguimientoPage() {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = codigo.trim();
    if (!trimmed) {
      setError("Ingresa un código de pedido.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/ordenes/por-codigo?codigo=${encodeURIComponent(trimmed)}`);
      if (!res.ok) {
        throw new Error("No se encontró una orden con ese código.");
      }

      const data = await res.json();
      const orden = Array.isArray(data.ordenes)
        ? data.ordenes[0]
        : data.orden;

      if (!orden || !orden.id) {
        throw new Error("No se encontró una orden con ese código.");
      }

      router.push(`/seguimiento/${orden.id}`);
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al buscar la orden.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-deep-navy via-bridge-blue to-vibrant-cyan flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center">
            Seguir mi Pedido
          </CardTitle>
          <CardDescription className="text-center">
            Ingresa el código de pedido que recibiste por WhatsApp o Email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="codigo">Código de Pedido</Label>
              <Input
                id="codigo"
                type="text"
                placeholder="Ej: ORD-2025-001"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="text-sm text-red-100 bg-red-500/40 rounded-md px-3 py-2">
                {error}
              </p>
            )}
            <Button
              className="w-full bg-vibrant-cyan hover:bg-vibrant-cyan/90"
              type="submit"
              disabled={loading}
            >
              {loading ? "Buscando..." : "Buscar Pedido"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <Link href="/" className="text-vibrant-cyan hover:underline">
              ← Volver al inicio
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}