"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";

interface Orden {
  id: string;
  clienteNombre: string;
  clienteTelefono?: string;
  direccion: string;
  latitud: number;
  longitud: number;
  estado: "pending" | "assigned" | "in_route" | "delivered" | "cancelled";
  motoAsignada?: {
    id: string;
    placa: string;
    conductorNombre: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Moto {
  id: string;
  placa: string;
  conductorNombre: string;
  estado: "available" | "busy" | "inactive";
}

export default function EditarOrdenPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [orden, setOrden] = useState<Orden | null>(null);
  const [motos, setMotos] = useState<Moto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      cargarOrden();
      cargarMotos();
    }
  }, [id]);

  const cargarOrden = async () => {
    try {
      const response = await fetch(`/api/ordenes/${id}`);
      if (!response.ok) throw new Error("Error al cargar orden");
      
      const data = await response.json();
      setOrden(data);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al cargar la orden");
    } finally {
      setLoading(false);
    }
  };

  const cargarMotos = async () => {
    try {
      const response = await fetch("/api/motos?estado=available");
      if (!response.ok) throw new Error("Error al cargar motos");
      
      const data = await response.json();
      setMotos(data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orden) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/ordenes/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orden),
      });

      if (!response.ok) throw new Error("Error al actualizar orden");
      
      toast.success("Orden actualizada correctamente");
      router.push("/admin/ordenes");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al actualizar la orden");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof Orden, value: any) => {
    if (!orden) return;
    setOrden({ ...orden, [field]: value });
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

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Editar Orden</h1>
          <button
            onClick={() => router.push("/admin/ordenes")}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            ← Volver
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Información del Cliente */}
          <div className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">Información del Cliente</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Cliente
                </label>
                <input
                  type="text"
                  value={orden.clienteNombre}
                  onChange={(e) => handleInputChange("clienteNombre", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono del Cliente
                </label>
                <input
                  type="tel"
                  value={orden.clienteTelefono || ""}
                  onChange={(e) => handleInputChange("clienteTelefono", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Dirección */}
          <div className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">Dirección de Entrega</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  value={orden.direccion}
                  onChange={(e) => handleInputChange("direccion", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                  Latitud
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={orden.latitud}
                    onChange={(e) => handleInputChange("latitud", parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Longitud
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={orden.longitud}
                    onChange={(e) => handleInputChange("longitud", parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Estado y Moto */}
          <div className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">Estado de la Orden</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={orden.estado}
                  onChange={(e) => handleInputChange("estado", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pendiente</option>
                  <option value="assigned">Asignada</option>
                  <option value="in_route">En Ruta</option>
                  <option value="delivered">Entregada</option>
                  <option value="cancelled">Cancelada</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Moto Asignada
                </label>
                <select
                  value={orden.motoAsignada?.id || ""}
                  onChange={(e) => {
                    const motoId = e.target.value;
                    if (motoId) {
                      const moto = motos.find(m => m.id === motoId);
                      handleInputChange("motoAsignada", moto ? {
                        id: moto.id,
                        placa: moto.placa,
                        conductorNombre: moto.conductorNombre
                      } : undefined);
                    } else {
                      handleInputChange("motoAsignada", undefined);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sin asignar</option>
                  {motos.map((moto) => (
                    <option key={moto.id} value={moto.id}>
                      {moto.placa} - {moto.conductorNombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push("/admin/ordenes")}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
