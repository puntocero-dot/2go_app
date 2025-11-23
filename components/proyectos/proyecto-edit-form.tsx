"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { Label } from "@/components/ui/label";
import { prisma } from "@/lib/prisma";

interface ProyectoEditFormProps {
  proyecto: any;
}

export function ProyectoEditForm({ proyecto }: ProyectoEditFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombreComercial: proyecto.nombreComercial || "",
    activo: proyecto.activo ?? true,
    tipoCliente: proyecto.tipoCliente || "CONSUMIDOR_FINAL",
    datosFacturacion: typeof proyecto.datosFacturacion === 'object' ? proyecto.datosFacturacion : {},
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/proyectos/${proyecto.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/admin/proyectos');
        router.refresh();
      } else {
        throw new Error('Error al actualizar el proyecto');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar el proyecto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Label htmlFor="nombreComercial">Nombre Comercial *</Label>
          <input
            type="text"
            id="nombreComercial"
            name="nombreComercial"
            value={formData.nombreComercial}
            onChange={handleChange}
            required
            className="w-full mt-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            placeholder="Ej: Muebles S.A."
          />
        </div>

        <div>
          <Label htmlFor="activo">Estado *</Label>
          <select
            id="activo"
            name="activo"
            value={formData.activo ? "true" : "false"}
            onChange={(e) => setFormData(prev => ({ ...prev, activo: e.target.value === "true" }))}
            required
            className="w-full mt-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          >
            <option value="true">Activo</option>
            <option value="false">Inactivo</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="tipoCliente">Tipo de Facturación (El Salvador) *</Label>
          <select
            id="tipoCliente"
            name="tipoCliente"
            value={formData.tipoCliente}
            onChange={handleChange}
            required
            className="w-full mt-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          >
            <option value="CONSUMIDOR_FINAL">Consumidor Final</option>
            <option value="CREDITO_FISCAL">Crédito Fiscal</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Selecciona el tipo de facturación según las leyes de El Salvador
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
        <EnhancedButton
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancelar
        </EnhancedButton>
        <EnhancedButton
          type="submit"
          variant="default"
          disabled={isLoading}
          className="min-w-[140px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Guardando...
            </>
          ) : (
            <>
              Guardar Cambios
            </>
          )}
        </EnhancedButton>
      </div>
    </form>
  );
}
