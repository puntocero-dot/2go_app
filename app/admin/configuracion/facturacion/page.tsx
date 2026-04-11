"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ImageUpload";
import { Save, Loader2, Building2, Palette, FileText } from "lucide-react";
import { addToast } from "@/components/ui/toaster";

interface ConfiguracionFacturacion {
  id: string;
  nombreEmpresa: string;
  giro: string;
  direccion: string;
  telefono: string;
  email: string;
  logoUrl: string | null;
  colorPrimario: string;
  colorAccent: string;
  terminosCondiciones: string | null;
  notasPiePagina: string;
}

export default function ConfiguracionFacturacionPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<ConfiguracionFacturacion | null>(null);

  const [formData, setFormData] = useState({
    nombreEmpresa: "",
    giro: "",
    direccion: "",
    telefono: "",
    email: "",
    logoUrl: "",
    colorPrimario: "#2E4F4F",
    colorAccent: "#ED7D32",
    terminosCondiciones: "",
    notasPiePagina: "",
  });

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
      const response = await fetch("/api/configuracion/facturacion");
      if (!response.ok) throw new Error("Error al cargar configuración");

      const data = await response.json();
      setConfig(data);

      setFormData({
        nombreEmpresa: data.nombreEmpresa || "",
        giro: data.giro || "",
        direccion: data.direccion || "",
        telefono: data.telefono || "",
        email: data.email || "",
        logoUrl: data.logoUrl || "",
        colorPrimario: data.colorPrimario || "#2E4F4F",
        colorAccent: data.colorAccent || "#ED7D32",
        terminosCondiciones: data.terminosCondiciones || "",
        notasPiePagina: data.notasPiePagina || "",
      });
    } catch (error) {
      console.error("Error:", error);
      addToast({ title: "Error al cargar la configuracion", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/configuracion/facturacion", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al guardar configuración");
      }

      addToast({ title: "Configuracion guardada correctamente", variant: "success" });
      cargarConfiguracion();
    } catch (error) {
      console.error("Error:", error);
      addToast({ title: "Error al guardar la configuracion", description: error instanceof Error ? error.message : "Error desconocido", variant: "destructive" });
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
      <div className="max-w-5xl mx-auto p-6">
        <EnhancedCard>
          <div className="p-6">
            <div className="flex items-center mb-6">
              <Building2 className="w-8 h-8 text-primary mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-foreground">Configuración de Facturación</h1>
                <p className="text-sm text-muted-foreground">
                  Personaliza los datos que aparecerán en tus facturas PDF
                </p>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              {/* Datos de la Empresa */}
              <div className="border rounded-lg p-6 bg-background">
                <h2 className="text-xl font-semibold mb-4 text-foreground flex items-center">
                  <Building2 className="w-5 h-5 mr-2" />
                  Datos de la Empresa
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nombreEmpresa">Nombre de la Empresa</Label>
                    <input
                      id="nombreEmpresa"
                      type="text"
                      value={formData.nombreEmpresa}
                      onChange={(e) => handleInputChange("nombreEmpresa", e.target.value)}
                      className="w-full mt-2 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="giro">Giro del Negocio</Label>
                    <input
                      id="giro"
                      type="text"
                      value={formData.giro}
                      onChange={(e) => handleInputChange("giro", e.target.value)}
                      className="w-full mt-2 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="direccion">Dirección</Label>
                    <input
                      id="direccion"
                      type="text"
                      value={formData.direccion}
                      onChange={(e) => handleInputChange("direccion", e.target.value)}
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
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="email">Email de Facturación</Label>
                    <input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="w-full mt-2 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Logo de la Empresa (opcional)</Label>
                    <div className="mt-2">
                      <ImageUpload
                        currentImage={formData.logoUrl}
                        onUploadComplete={(url) => handleInputChange("logoUrl", url)}
                        folder="logos"
                        label="Subir logo"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Colores Corporativos */}
              <div className="border rounded-lg p-6 bg-background">
                <h2 className="text-xl font-semibold mb-4 text-foreground flex items-center">
                  <Palette className="w-5 h-5 mr-2" />
                  Colores Corporativos
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="colorPrimario">Color Primario</Label>
                    <div className="flex items-center space-x-2 mt-2">
                      <input
                        id="colorPrimario"
                        type="color"
                        value={formData.colorPrimario}
                        onChange={(e) => handleInputChange("colorPrimario", e.target.value)}
                        className="w-16 h-12 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.colorPrimario}
                        onChange={(e) => handleInputChange("colorPrimario", e.target.value)}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="#2E4F4F"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="colorAccent">Color de Acento</Label>
                    <div className="flex items-center space-x-2 mt-2">
                      <input
                        id="colorAccent"
                        type="color"
                        value={formData.colorAccent}
                        onChange={(e) => handleInputChange("colorAccent", e.target.value)}
                        className="w-16 h-12 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.colorAccent}
                        onChange={(e) => handleInputChange("colorAccent", e.target.value)}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="#ED7D32"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Términos y Notas */}
              <div className="border rounded-lg p-6 bg-background">
                <h2 className="text-xl font-semibold mb-4 text-foreground flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Términos y Notas
                </h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="terminosCondiciones">Términos y Condiciones (opcional)</Label>
                    <textarea
                      id="terminosCondiciones"
                      value={formData.terminosCondiciones}
                      onChange={(e) => handleInputChange("terminosCondiciones", e.target.value)}
                      rows={4}
                      className="w-full mt-2 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Términos y condiciones que aparecerán en la factura..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="notasPiePagina">Notas de Pie de Página</Label>
                    <textarea
                      id="notasPiePagina"
                      value={formData.notasPiePagina}
                      onChange={(e) => handleInputChange("notasPiePagina", e.target.value)}
                      rows={3}
                      className="w-full mt-2 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Notas que aparecerán al pie de la factura..."
                      required
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
                      Guardar Configuración
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
