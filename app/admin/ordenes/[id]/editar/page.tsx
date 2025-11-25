"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";

interface Orden {
  id: string;
  codigoReferenciaRetail: string;
  usuarioFinal: {
    nombre: string;
    telefono: string | null;
    direccion: string;
    municipio: string;
    departamento: string;
  };
  direccionEntrega: string;
  latitud: number | null;
  longitud: number | null;
  estado: string;
  armadorId: string | null;
  armador?: {
    id: string;
    usuario: {
      nombre: string;
    };
  } | null;
}

interface Armador {
  id: string;
  usuario: {
    nombre: string;
  };
  estado: string;
}

export default function EditarOrdenPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [orden, setOrden] = useState<Orden | null>(null);
  const [armadores, setArmadores] = useState<Armador[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    clienteNombre: "",
    clienteTelefono: "",
    direccion: "",
    latitud: "",
    longitud: "",
    estado: "SIN_ASIGNAR",
    armadorId: "",
  });

  useEffect(() => {
    cargarUsuario();
    if (id) {
      cargarOrden();
      cargarArmadores();
    }
  }, [id]);
  
  const cargarUsuario = async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      }
    } catch (error) {
      console.error("Error cargando usuario:", error);
    }
  };

  const cargarOrden = async () => {
    try {
      const response = await fetch(`/api/ordenes/${id}`);
      if (!response.ok) throw new Error("Error al cargar orden");
      
      const data = await response.json();
      
      // Validar que data tenga la estructura esperada
      if (!data || typeof data !== 'object') {
        throw new Error("Datos de orden inválidos");
      }
      
      setOrden(data);
      
      // Cargar datos en el formulario con validaciones
      setFormData({
        clienteNombre: data.usuarioFinal?.nombre || "",
        clienteTelefono: data.usuarioFinal?.telefono || "",
        direccion: data.direccionEntrega || "",
        latitud: data.latitud?.toString() || "",
        longitud: data.longitud?.toString() || "",
        estado: (data.estado && typeof data.estado === 'string') ? data.estado : "SIN_ASIGNAR",
        armadorId: data.armadorId || "",
      });
    } catch (error) {
      console.error("Error:", error);
      alert("Error al cargar la orden: " + (error instanceof Error ? error.message : "Error desconocido"));
      setOrden(null);
    } finally {
      setLoading(false);
    }
  };

  const cargarArmadores = async () => {
    try {
      const response = await fetch("/api/armadores");
      if (!response.ok) throw new Error("Error al cargar armadores");
      
      const data = await response.json();
      // Asegurar que data es un array antes de filtrar
      const armadoresArray = Array.isArray(data) ? data : [];
      setArmadores(armadoresArray.filter((a: Armador) => a.estado === "ACTIVO"));
    } catch (error) {
      console.error("Error:", error);
      setArmadores([]); // Fallback a array vacío
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orden) return;

    setSaving(true);
    try {
      const payload: any = {
        estado: formData.estado,
      };
      
      if (formData.armadorId) {
        payload.armadorId = formData.armadorId;
      }
      
      // Solo actualizar ubicación si se proporcionan ambos valores
      if (formData.latitud && formData.longitud) {
        payload.latitud = parseFloat(formData.latitud);
        payload.longitud = parseFloat(formData.longitud);
      }

      const response = await fetch(`/api/ordenes/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al actualizar orden");
      }
      
      alert("✅ Orden actualizada correctamente");
      router.push("/admin/ordenes");
    } catch (error) {
      console.error("Error:", error);
      alert("❌ Error al actualizar la orden: " + (error instanceof Error ? error.message : "Error desconocido"));
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!orden) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Orden no encontrada</h2>
          <button
            onClick={() => router.push("/admin/ordenes")}
            className="text-blue-600 hover:text-blue-800"
          >
            Volver a órdenes
          </button>
        </div>
      </div>
    );
  }

  const ESTADOS_ORDEN = [
    { value: "SIN_ASIGNAR", label: "Sin asignar" },
    { value: "ASIGNADO", label: "Asignado" },
    { value: "EN_RUTA", label: "En ruta" },
    { value: "ARMADO_INICIADO", label: "Armado iniciado" },
    { value: "ARMADO_FINALIZADO", label: "Armado finalizado" },
    { value: "ARMADO_COMPLETADO", label: "Armado completado" },
    { value: "CANCELADA", label: "Cancelada" },
  ];

  return (
    <>
      {user && <Navbar user={user} />}
      <div className="max-w-5xl mx-auto p-6">
        <EnhancedCard>
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-foreground">Editar Orden</h1>
              <Link href="/admin/ordenes">
                <EnhancedButton variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </EnhancedButton>
              </Link>
            </div>

            {orden && (
              <div className="mb-6 p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Código:</strong> {orden.codigoReferenciaRetail}
                </p>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
              {/* Información del Cliente */}
              <div className="border rounded-lg p-6 bg-background">
                <h2 className="text-xl font-semibold mb-4 text-foreground">Información del Cliente</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="clienteNombre">Nombre del Cliente</Label>
                    <input
                      id="clienteNombre"
                      type="text"
                      value={formData.clienteNombre}
                      disabled
                      className="w-full mt-2 px-4 py-3 border border-gray-300 rounded-lg bg-muted text-muted-foreground cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Campo no editable</p>
                  </div>
                  <div>
                    <Label htmlFor="clienteTelefono">Teléfono del Cliente</Label>
                    <input
                      id="clienteTelefono"
                      type="tel"
                      value={formData.clienteTelefono}
                      disabled
                      className="w-full mt-2 px-4 py-3 border border-gray-300 rounded-lg bg-muted text-muted-foreground cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Campo no editable</p>
                  </div>
                </div>
              </div>

              {/* Dirección */}
              <div className="border rounded-lg p-6 bg-background">
                <h2 className="text-xl font-semibold mb-4 text-foreground">Dirección de Entrega</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="direccion">Dirección</Label>
                    <input
                      id="direccion"
                      type="text"
                      value={formData.direccion}
                      disabled
                      className="w-full mt-2 px-4 py-3 border border-gray-300 rounded-lg bg-muted text-muted-foreground cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Campo no editable</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="latitud">Latitud</Label>
                      <input
                        id="latitud"
                        type="number"
                        step="any"
                        value={formData.latitud}
                        onChange={(e) => handleInputChange("latitud", e.target.value)}
                        className="w-full mt-2 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <Label htmlFor="longitud">Longitud</Label>
                      <input
                        id="longitud"
                        type="number"
                        step="any"
                        value={formData.longitud}
                        onChange={(e) => handleInputChange("longitud", e.target.value)}
                        className="w-full mt-2 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Estado y Armador */}
              <div className="border rounded-lg p-6 bg-background">
                <h2 className="text-xl font-semibold mb-4 text-foreground">Estado de la Orden</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="estado">Estado</Label>
                    <select
                      id="estado"
                      value={formData.estado}
                      onChange={(e) => handleInputChange("estado", e.target.value)}
                      className="w-full mt-2 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {ESTADOS_ORDEN.map((estado) => (
                        <option key={estado.value} value={estado.value}>
                          {estado.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="armadorId">Moto Asignada</Label>
                    <select
                      id="armadorId"
                      value={formData.armadorId}
                      onChange={(e) => handleInputChange("armadorId", e.target.value)}
                      className="w-full mt-2 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Sin asignar</option>
                      {armadores.map((armador) => (
                        <option key={armador.id} value={armador.id}>
                          {armador.usuario.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-4">
                <Link href="/admin/ordenes">
                  <EnhancedButton type="button" variant="outline">
                    Cancelar
                  </EnhancedButton>
                </Link>
                <EnhancedButton
                  type="submit"
                  disabled={saving}
                >
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
