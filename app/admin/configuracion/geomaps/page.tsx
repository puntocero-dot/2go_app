"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin, Settings } from "lucide-react";

interface GeomapsConfig {
  stopDurationMin: number;
  stopRadiusMeters: number;
  speedingKmh: number;
  clienteRadiusMeters: number;
}

export default function GeomapsConfigPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<GeomapsConfig | null>(null);

  useEffect(() => {
    cargarUsuario();
    cargarConfiguracion();
  }, []);

  const cargarUsuario = async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (!response.ok) {
        router.push("/login");
        return;
      }

      const data = await response.json();
      const usuario = data?.user ?? data;

      if (!usuario || usuario.rol !== "ADMIN") {
        router.push("/login");
        return;
      }

      setUser(usuario);
    } catch (error) {
      console.error("Error cargando usuario:", error);
    }
  };

  const cargarConfiguracion = async () => {
    try {
      const response = await fetch("/api/configuracion/geomaps");
      if (!response.ok) throw new Error("Error al cargar configuración Geomaps");

      const data = await response.json();
      setFormData(data);
    } catch (error) {
      console.error("Error:", error);
      alert("Error al cargar la configuración Geomaps");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    setSaving(true);

    try {
      const response = await fetch("/api/configuracion/geomaps", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al guardar configuración Geomaps");
      }

      alert("✅ Configuración Geomaps guardada correctamente");
      cargarConfiguracion();
    } catch (error) {
      console.error("Error:", error);
      alert(
        "❌ Error al guardar la configuración Geomaps: " +
          (error instanceof Error ? error.message : "Error desconocido")
      );
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof GeomapsConfig, value: string) => {
    setFormData((prev) =>
      prev
        ? {
            ...prev,
            [field]: Number(value),
          }
        : prev
    );
  };

  if (loading || !formData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      {user && <Navbar user={user} />}
      <div className="max-w-4xl mx-auto p-6">
        <EnhancedCard>
          <div className="p-6">
            <div className="flex items-center mb-6">
              <MapPin className="w-8 h-8 text-primary mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                  Configuración Geomaps
                  <Settings className="w-5 h-5 text-muted-foreground" />
                </h1>
                <p className="text-sm text-muted-foreground">
                  Reglas para analizar rutas de armadores (paradas, velocidad y cercanía a clientes).
                </p>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="border rounded-lg p-6 bg-background space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="stopDurationMin">Duración de parada larga (minutos)</Label>
                    <input
                      id="stopDurationMin"
                      type="number"
                      min={1}
                      value={formData.stopDurationMin}
                      onChange={(e) => handleInputChange("stopDurationMin", e.target.value)}
                      className="w-full mt-2 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Tiempo mínimo sin movimiento significativo para considerar una parada larga.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="stopRadiusMeters">Radio de parada (metros)</Label>
                    <input
                      id="stopRadiusMeters"
                      type="number"
                      min={1}
                      value={formData.stopRadiusMeters}
                      onChange={(e) => handleInputChange("stopRadiusMeters", e.target.value)}
                      className="w-full mt-2 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Distancia máxima recorrida para seguir considerando que está detenido.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="speedingKmh">Umbral de velocidad alta (km/h)</Label>
                    <input
                      id="speedingKmh"
                      type="number"
                      min={1}
                      value={formData.speedingKmh}
                      onChange={(e) => handleInputChange("speedingKmh", e.target.value)}
                      className="w-full mt-2 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Velocidad a partir de la cual se marcará un evento de exceso de velocidad.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="clienteRadiusMeters">Radio de cliente (metros)</Label>
                    <input
                      id="clienteRadiusMeters"
                      type="number"
                      min={1}
                      value={formData.clienteRadiusMeters}
                      onChange={(e) => handleInputChange("clienteRadiusMeters", e.target.value)}
                      className="w-full mt-2 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Radio para considerar que el armador estuvo en la ubicación del cliente.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <EnhancedButton type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar Configuración"
                  )}
                </EnhancedButton>
              </div>
            </form>
          </div>
        </EnhancedCard>
      </div>
    </>
  );
}
