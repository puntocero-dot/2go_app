"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ImageUpload";
import { Save, Loader2, User, Lock, Image } from "lucide-react";

export default function PerfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    nombre: "",
    telefono: "",
    fotoPerfil: "",
    password: "",
    passwordActual: "",
    passwordConfirm: "",
  });

  useEffect(() => {
    cargarPerfil();
  }, []);

  const cargarPerfil = async () => {
    try {
      const response = await fetch("/api/usuarios/perfil");
      if (!response.ok) throw new Error("Error al cargar perfil");

      const data = await response.json();
      setUser(data);

      setFormData({
        nombre: data.nombre || "",
        telefono: data.telefono || "",
        fotoPerfil: data.fotoPerfil || "",
        password: "",
        passwordActual: "",
        passwordConfirm: "",
      });
    } catch (error) {
      console.error("Error:", error);
      alert("Error al cargar el perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar contraseñas si se quiere cambiar
    if (formData.password) {
      if (formData.password !== formData.passwordConfirm) {
        alert("❌ Las contraseñas no coinciden");
        return;
      }
      if (formData.password.length < 6) {
        alert("❌ La contraseña debe tener al menos 6 caracteres");
        return;
      }
      if (!formData.passwordActual) {
        alert("❌ Debes ingresar tu contraseña actual");
        return;
      }
    }

    setSaving(true);

    try {
      const payload: any = {
        nombre: formData.nombre,
        telefono: formData.telefono,
        fotoPerfil: formData.fotoPerfil || null,
      };

      if (formData.password) {
        payload.password = formData.password;
        payload.passwordActual = formData.passwordActual;
      }

      const response = await fetch("/api/usuarios/perfil", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al guardar perfil");
      }

      alert("✅ Perfil actualizado correctamente");
      
      // Limpiar campos de contraseña
      setFormData(prev => ({
        ...prev,
        password: "",
        passwordActual: "",
        passwordConfirm: "",
      }));
      
      cargarPerfil();
    } catch (error) {
      console.error("Error:", error);
      alert("❌ Error al actualizar el perfil: " + (error instanceof Error ? error.message : "Error desconocido"));
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
      <div className="max-w-4xl mx-auto p-6">
        <EnhancedCard>
          <div className="p-6">
            <div className="flex items-center mb-6">
              <User className="w-8 h-8 text-primary mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-foreground">Mi Perfil</h1>
                <p className="text-sm text-muted-foreground">
                  Actualiza tu información personal
                </p>
              </div>
            </div>

            {user && (
              <div className="mb-6 p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Email:</strong> {user.email}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Rol:</strong> {user.rol}
                </p>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
              {/* Información Personal */}
              <div className="border rounded-lg p-6 bg-background">
                <h2 className="text-xl font-semibold mb-4 text-foreground flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Información Personal
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nombre">Nombre Completo</Label>
                    <input
                      id="nombre"
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => handleInputChange("nombre", e.target.value)}
                      className="w-full mt-2 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefono">Teléfono</Label>
                    <input
                      id="telefono"
                      type="tel"
                      value={formData.telefono}
                      onChange={(e) => handleInputChange("telefono", e.target.value)}
                      className="w-full mt-2 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Foto de Perfil */}
              <div className="border rounded-lg p-6 bg-background">
                <h2 className="text-xl font-semibold mb-4 text-foreground flex items-center">
                  <Image className="w-5 h-5 mr-2" />
                  Foto de Perfil
                </h2>
                <div>
                  <Label>Subir Foto</Label>
                  <div className="mt-2">
                    <ImageUpload
                      currentImage={formData.fotoPerfil}
                      onUploadComplete={(url) => handleInputChange("fotoPerfil", url)}
                      folder="perfiles"
                      label="Click para subir"
                    />
                  </div>
                </div>
              </div>

              {/* Cambiar Contraseña */}
              <div className="border rounded-lg p-6 bg-background">
                <h2 className="text-xl font-semibold mb-4 text-foreground flex items-center">
                  <Lock className="w-5 h-5 mr-2" />
                  Cambiar Contraseña
                </h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="passwordActual">Contraseña Actual</Label>
                    <input
                      id="passwordActual"
                      type="password"
                      value={formData.passwordActual}
                      onChange={(e) => handleInputChange("passwordActual", e.target.value)}
                      className="w-full mt-2 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Requerida solo si cambias la contraseña"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Nueva Contraseña</Label>
                    <input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      className="w-full mt-2 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Dejar en blanco para no cambiar"
                    />
                  </div>
                  <div>
                    <Label htmlFor="passwordConfirm">Confirmar Nueva Contraseña</Label>
                    <input
                      id="passwordConfirm"
                      type="password"
                      value={formData.passwordConfirm}
                      onChange={(e) => handleInputChange("passwordConfirm", e.target.value)}
                      className="w-full mt-2 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Confirma tu nueva contraseña"
                    />
                  </div>
                </div>
              </div>

              {/* Botones */}
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
                      Guardar Cambios
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
