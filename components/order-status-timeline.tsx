import { formatearFecha } from "@/lib/utils";

type RegistroEstadoTimeline = {
  id: string;
  estadoCambiadoA: string;
  comentario: string | null;
  timestamp: Date | string;
  usuario?: {
    nombre: string | null;
    email?: string | null;
  } | null;
  latitud?: number | null;
  longitud?: number | null;
};

interface OrderStatusTimelineProps {
  registros: RegistroEstadoTimeline[];
}

export function OrderStatusTimeline({ registros }: OrderStatusTimelineProps) {
  if (!registros || registros.length === 0) {
    return <p className="text-gray-500">No hay registros de estado todavía.</p>;
  }

  return (
    <div className="space-y-4">
      <ol className="relative border-l border-gray-200 pl-4">
        {registros.map((registro, index) => {
          const estadoLabel = registro.estadoCambiadoA.replace(/_/g, " ");
          const fecha = formatearFecha(registro.timestamp as Date);
          const isLast = index === registros.length - 1;

          return (
            <li key={registro.id} className="mb-6 ml-2">
              <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-white bg-vibrant-cyan shadow" />
              <div className="rounded-md bg-white px-3 py-2 shadow-sm ring-1 ring-gray-200">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-gray-900 uppercase">
                    {estadoLabel}
                  </p>
                  <span className="text-xs text-gray-500">{fecha}</span>
                </div>
                {registro.usuario?.nombre ? (
                  <p className="mt-1 text-xs text-gray-500">
                    Por: <span className="font-medium">{registro.usuario.nombre}</span>
                    {registro.usuario.email ? ` (${registro.usuario.email})` : ""}
                  </p>
                ) : null}
                {registro.comentario ? (
                  <p className="mt-1 text-xs text-gray-600">{registro.comentario}</p>
                ) : null}
                {registro.latitud != null && registro.longitud != null ? (
                  <p className="mt-1 text-[11px] text-gray-400">
                    GPS: {registro.latitud.toFixed(5)}, {registro.longitud.toFixed(5)}
                  </p>
                ) : null}
                {isLast ? (
                  <p className="mt-1 text-[11px] font-medium text-emerald-700">
                    Último estado registrado
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
