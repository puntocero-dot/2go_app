import * as React from "react";
import {
  Circle,
  Navigation,
  Hammer,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type EstadoOrden =
  | "ASIGNADO"
  | "EN_RUTA"
  | "ARMADO_INICIADO"
  | "ARMADO_FINALIZADO"
  | "ARMADO_COMPLETADO"
  | "CANCELADA"
  | "RECHAZADO";

interface EstadoConfig {
  label: string;
  color: string;
  bgColor: string;
  icon: LucideIcon;
  badgeClassName: string;
}

const ESTADOS_CONFIG: Record<EstadoOrden, EstadoConfig> = {
  ASIGNADO: {
    label: "Asignado",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    icon: Circle,
    badgeClassName: "bg-blue-500 hover:bg-blue-600 text-white",
  },
  EN_RUTA: {
    label: "En ruta",
    color: "text-yellow-700",
    bgColor: "bg-yellow-50",
    icon: Navigation,
    badgeClassName: "bg-yellow-500 hover:bg-yellow-600 text-white",
  },
  ARMADO_INICIADO: {
    label: "Armado iniciado",
    color: "text-orange-700",
    bgColor: "bg-orange-50",
    icon: Hammer,
    badgeClassName: "bg-orange-500 hover:bg-orange-600 text-white",
  },
  ARMADO_FINALIZADO: {
    label: "Armado finalizado",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    icon: CheckCircle,
    badgeClassName: "bg-emerald-500 hover:bg-emerald-600 text-white",
  },
  ARMADO_COMPLETADO: {
    label: "Completado",
    color: "text-green-700",
    bgColor: "bg-green-50",
    icon: CheckCircle,
    badgeClassName: "bg-green-500 hover:bg-green-600 text-white",
  },
  CANCELADA: {
    label: "Cancelada",
    color: "text-gray-700",
    bgColor: "bg-gray-50",
    icon: XCircle,
    badgeClassName: "bg-gray-500 hover:bg-gray-600 text-white",
  },
  RECHAZADO: {
    label: "Rechazado",
    color: "text-red-700",
    bgColor: "bg-red-50",
    icon: AlertCircle,
    badgeClassName: "bg-red-500 hover:bg-red-600 text-white",
  },
};

export function getEstadoConfig(estado: string): EstadoConfig {
  return ESTADOS_CONFIG[estado as EstadoOrden] || ESTADOS_CONFIG.ASIGNADO;
}

export function getEstadoLabel(estado: string): string {
  return getEstadoConfig(estado).label;
}

export function getEstadoBadgeClassName(estado: string): string {
  return getEstadoConfig(estado).badgeClassName;
}

export function getEstadoIcon(estado: string): LucideIcon {
  return getEstadoConfig(estado).icon;
}

// Componente helper para Badge con icono
export function EstadoBadge({ estado }: { estado: string }): React.ReactElement {
  const config = getEstadoConfig(estado);
  const Icon = config.icon;

  return React.createElement(
    "span",
    {
      className:
        "inline-flex items-center justify-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold min-w-[120px] " +
        config.badgeClassName,
    },
    React.createElement(Icon, { className: "h-3 w-3" }),
    config.label,
  );
}
