"use client";

import { useState } from "react";
import { Circle, Coffee, Utensils, Power } from "lucide-react";

interface EstadoLoggeoSelectorProps {
  estadoActual: string;
  onCambioEstado: (nuevoEstado: string) => void;
}

const ESTADOS = [
  { value: "ACTIVO", label: "Activo", icon: Circle, color: "text-green-500", bgColor: "bg-green-100" },
  { value: "LUNCH", label: "Lunch", icon: Utensils, color: "text-orange-500", bgColor: "bg-orange-100" },
  { value: "BREAK", label: "Break", icon: Coffee, color: "text-yellow-500", bgColor: "bg-yellow-100" },
  { value: "OFFLINE", label: "Offline", icon: Power, color: "text-gray-500", bgColor: "bg-gray-100" },
];

export function EstadoLoggeoSelector({ estadoActual, onCambioEstado }: EstadoLoggeoSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const estadoSeleccionado = ESTADOS.find((e) => e.value === estadoActual) || ESTADOS[3];
  const Icon = estadoSeleccionado.icon;

  const handleCambio = async (nuevoEstado: string) => {
    setIsOpen(false);
    onCambioEstado(nuevoEstado);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${estadoSeleccionado.bgColor} hover:opacity-80 transition-opacity`}
      >
        <Icon className={`w-4 h-4 ${estadoSeleccionado.color}`} />
        <span className={`text-sm font-medium ${estadoSeleccionado.color}`}>
          {estadoSeleccionado.label}
        </span>
      </button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-[1000]"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-[1001]">
            <div className="py-1" role="menu">
              {ESTADOS.map((estado) => {
                const EstadoIcon = estado.icon;
                return (
                  <button
                    key={estado.value}
                    onClick={() => handleCambio(estado.value)}
                    className={`flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                      estadoActual === estado.value ? "bg-gray-50" : ""
                    }`}
                    role="menuitem"
                  >
                    <EstadoIcon className={`w-4 h-4 mr-3 ${estado.color}`} />
                    <span className={estado.color}>{estado.label}</span>
                    {estadoActual === estado.value && (
                      <Circle className="w-2 h-2 ml-auto fill-current text-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
