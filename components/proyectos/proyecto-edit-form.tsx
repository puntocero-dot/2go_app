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
    nombreComercial: proyecto.nombreComercial,
    estado: proyecto.estado,
    descripcion: proyecto.descripcion || "",
    contactoEmail: proyecto.contactoEmail || "",
    contactoTelefono: proyecto.contactoTelefono || "",
    direccion: proyecto.direccion || "",
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
          <Label htmlFor="estado">Estado *</Label>
          <select
            id="estado"
            name="estado"
            value={formData.estado}
            onChange={handleChange}
            required
            className="w-full mt-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          >
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
            <option value="en_progreso">En Progreso</option>
            <option value="completado">Completado</option>
          </select>
        </div>

        <div>
          <Label htmlFor="contactoEmail">Email de Contacto</Label>
          <input
            type="email"
            id="contactoEmail"
            name="contactoEmail"
            value={formData.contactoEmail}
            onChange={handleChange}
            className="w-full mt-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            placeholder="contacto@empresa.com"
          />
        </div>

        <div>
          <Label htmlFor="contactoTelefono">Teléfono de Contacto</Label>
          <input
            type="tel"
            id="contactoTelefono"
            name="contactoTelefono"
            value={formData.contactoTelefono}
            onChange={handleChange}
            className="w-full mt-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            placeholder="+1 234 567 8900"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="direccion">Dirección</Label>
        <input
          type="text"
          id="direccion"
          name="direccion"
          value={formData.direccion}
          onChange={handleChange}
          className="w-full mt-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          placeholder="Calle Principal #123, Ciudad, País"
        />
      </div>

      <div>
        <Label htmlFor="descripcion">Descripción</Label>
        <textarea
          id="descripcion"
          name="descripcion"
          value={formData.descripcion}
          onChange={handleChange}
          rows={4}
          className="w-full mt-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
          placeholder="Describe el proyecto, sus características y objetivos..."
        />
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
