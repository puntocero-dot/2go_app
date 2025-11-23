"use client";

import { Label } from "@/components/ui/label";
import { Filter } from "lucide-react";

interface MapaFiltersProps {
  proyectos: Array<{ id: string; nombreComercial: string }>;
}

export function MapaFilters({ proyectos }: MapaFiltersProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
      <div className="flex items-center mb-6">
        <Filter className="w-5 h-5 mr-2 text-primary" />
        <h3 className="text-lg font-semibold">Filtros del Mapa</h3>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Label htmlFor="proyecto-filter" className="text-sm font-medium">
            Proyecto
          </Label>
          <select 
            id="proyecto-filter"
            className="w-full mt-1 rounded-lg border border-input bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            onChange={(e) => {
              // Filtrar elementos en el mapa
              const event = new CustomEvent('filterByProject', { detail: e.target.value });
              window.dispatchEvent(event);
            }}
          >
            <option value="ALL">Todos los proyectos</option>
            {proyectos.map((proyecto) => (
              <option key={proyecto.id} value={proyecto.id}>
                {proyecto.nombreComercial}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="estado-filter" className="text-sm font-medium">
            Estado
          </Label>
          <select 
            id="estado-filter"
            className="w-full mt-1 rounded-lg border border-input bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            onChange={(e) => {
              const event = new CustomEvent('filterByEstado', { detail: e.target.value });
              window.dispatchEvent(event);
            }}
          >
            <option value="ALL">Todos los estados</option>
            <option value="SIN_ASIGNAR">Sin asignar</option>
            <option value="ASIGNADO">Asignado</option>
            <option value="EN_RUTA">En ruta</option>
            <option value="ENTREGADO">Entregado</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
        </div>
      </div>
    </div>
  );
}
