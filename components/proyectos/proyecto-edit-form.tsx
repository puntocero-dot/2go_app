"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { Label } from "@/components/ui/label";

interface ProyectoEditFormProps {
  proyecto: any;
}

export function ProyectoEditForm({ proyecto }: ProyectoEditFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const datosFacturacion = typeof proyecto.datosFacturacion === 'object' ? proyecto.datosFacturacion : {};
  
  const [formData, setFormData] = useState({
    nombreComercial: proyecto.nombreComercial || "",
    activo: proyecto.activo ?? true,
    tipoCliente: proyecto.tipoCliente || "CONSUMIDOR_FINAL",
    contactoEmail: proyecto.contactoEmail || "",
    contactoTelefono: proyecto.contactoTelefono || "",
    direccion: proyecto.direccion || "",
    descripcion: proyecto.descripcion || "",
    // Campos fiscales
    nit: (datosFacturacion as any)?.nit || "",
    dui: (datosFacturacion as any)?.dui || "",
    nrc: (datosFacturacion as any)?.nrc || "",
    giro: (datosFacturacion as any)?.giro || "",
    razonSocial: (datosFacturacion as any)?.razonSocial || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Construir datosFacturacion según el tipo de cliente
      const datosFacturacion: any = {};
      
      if (formData.tipoCliente === "CREDITO_FISCAL") {
        datosFacturacion.nit = formData.nit;
        datosFacturacion.nrc = formData.nrc;
        datosFacturacion.razonSocial = formData.razonSocial;
        datosFacturacion.giro = formData.giro;
      } else {
        datosFacturacion.dui = formData.dui;
      }

      const payload = {
        nombreComercial: formData.nombreComercial,
        activo: formData.activo,
        tipoCliente: formData.tipoCliente,
        contactoEmail: formData.contactoEmail,
        contactoTelefono: formData.contactoTelefono,
        direccion: formData.direccion,
        descripcion: formData.descripcion,
        datosFacturacion,
      };

      const response = await fetch(`/api/proyectos/${proyecto.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
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
            placeholder="+503 1234 5678"
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

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración de Facturación</h3>
        <div className="space-y-4">
          <div>
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

          {/* Campos fiscales según tipo de cliente */}
          {formData.tipoCliente === "CREDITO_FISCAL" ? (
            <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-900">Datos Fiscales - Crédito Fiscal</h4>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="nit">NIT *</Label>
                  <input
                    type="text"
                    id="nit"
                    name="nit"
                    value={formData.nit}
                    onChange={handleChange}
                    required
                    className="w-full mt-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="0000-000000-000-0"
                  />
                </div>

                <div>
                  <Label htmlFor="nrc">NRC *</Label>
                  <input
                    type="text"
                    id="nrc"
                    name="nrc"
                    value={formData.nrc}
                    onChange={handleChange}
                    required
                    className="w-full mt-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="000000-0"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="razonSocial">Razón Social *</Label>
                  <input
                    type="text"
                    id="razonSocial"
                    name="razonSocial"
                    value={formData.razonSocial}
                    onChange={handleChange}
                    required
                    className="w-full mt-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Nombre de la empresa S.A. de C.V."
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="giro">Giro del Negocio *</Label>
                  <input
                    type="text"
                    id="giro"
                    name="giro"
                    value={formData.giro}
                    onChange={handleChange}
                    required
                    className="w-full mt-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Ej: Venta de muebles y accesorios"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-900">Datos Fiscales - Consumidor Final</h4>
              
              <div>
                <Label htmlFor="dui">DUI</Label>
                <input
                  type="text"
                  id="dui"
                  name="dui"
                  value={formData.dui}
                  onChange={handleChange}
                  className="w-full mt-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="00000000-0"
                />
                <p className="text-xs text-gray-500 mt-1">Opcional para consumidor final</p>
              </div>
            </div>
          )}
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> Las reglas de facturación (cobro por volumen, prioridad, distancia, etc.) se configuran en la sección de "Reglas de Cobro" del proyecto.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
        <EnhancedButton
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/proyectos')}
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
