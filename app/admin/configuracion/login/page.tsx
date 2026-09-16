"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ImageUpload";
import { Save, Loader2, Image as ImageIcon } from "lucide-react";
import { addToast } from "@/components/ui/toaster";

export default function ConfiguracionLoginPage() {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [backgroundUrl, setBackgroundUrl] = useState("");

  useEffect(() => {
    cargarUsuario();
    cargarConfiguracion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const response = await fetch("/api/configuracion/login-background");
      if (!response.ok) throw new Error("Error al cargar configuración");

      const data = await response.json();
      setBackgroundUrl(data.url || "");
    } catch (error) {
      console.error("Error:", error);
      addToast({ title: "Error al cargar la configuracion", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!backgroundUrl) {
      addToast({ title: "Sube una imagen antes de guardar", variant: "destructive" });
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/configuracion/login-background", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: backgroundUrl }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al guardar configuración");
      }

      addToast({ title: "Imagen de fondo actualizada correctamente", variant: "success" });
    } catch (error) {
      console.error("Error:", error);
      addToast({ title: "Error al guardar la configuracion", description: error instanceof Error ? error.message : "Error desconocido", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      {user && <Navbar user={user} />}
      <div className="max-w-3xl mx-auto p-6">
        <EnhancedCard>
          <div className="p-6">
            <div className="flex items-center mb-6">
              <ImageIcon className="w-8 h-8 text-primary mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-foreground">Fondo de Login</h1>
                <p className="text-sm text-muted-foreground">
                  Sube la imagen de fondo que se mostrará en la pantalla de inicio de sesión
                </p>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="border rounded-lg p-6 bg-background">
                <Label>Imagen de Fondo</Label>
                <div className="mt-2">
                  <ImageUpload
                    currentImage={backgroundUrl}
                    onUploadComplete={(url) => setBackgroundUrl(url)}
                    folder="login-bg"
                    label="Subir imagen de fondo"
                  />
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
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Guardar Imagen
                    </>
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
