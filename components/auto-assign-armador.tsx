"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AutoAssignArmadorProps {
  ordenId: string;
  currentEstado: string;
}

interface SugerenciaArmador {
  armadorId: string;
  nombre: string;
  telefono: string | null;
  score: number;
  etaEstimadoMin: number;
}

interface AutoAssignResponse {
  sugerencia?: SugerenciaArmador;
  alternativas?: Array<
    Pick<SugerenciaArmador, "armadorId" | "nombre" | "score" | "etaEstimadoMin">
  >;
  heuristica?: string;
  message?: string;
  error?: string;
}

export function AutoAssignArmador({ ordenId, currentEstado }: AutoAssignArmadorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [sugerencia, setSugerencia] = useState<SugerenciaArmador | null>(null);
  const [alternativas, setAlternativas] = useState<AutoAssignResponse["alternativas"]>([]);
  const [heuristica, setHeuristica] = useState<string | undefined>();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionsLocked, setActionsLocked] = useState(false);
  const isTerminalEstado =
    currentEstado === "ARMADO_COMPLETADO" ||
    currentEstado === "CANCELADA" ||
    currentEstado === "RECHAZADO";

  const generarSugerencia = async () => {
    if (isTerminalEstado) return;
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      setSugerencia(null);
      setAlternativas([]);
      setHeuristica(undefined);

      const response = await fetch(`/api/ordenes/${ordenId}/asignacion-automatica`, {
        method: "POST",
      });

      const data: AutoAssignResponse = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "No se pudo generar la sugerencia");
      }

      if (!data.sugerencia) {
        setMessage(data.message ?? "No hay sugerencia disponible en este momento.");
        return;
      }

      setSugerencia(data.sugerencia);
      setAlternativas(data.alternativas ?? []);
      setHeuristica(data.heuristica);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  const aceptarSugerencia = async () => {
    if (!sugerencia || actionsLocked || isTerminalEstado) return;

    try {
      setActionsLocked(true);
      setError(null);
      setMessage(null);

      const payload: Record<string, unknown> = {
        armadorId: sugerencia.armadorId,
        autoAssignMeta: {
          heuristica: heuristica ?? null,
          score: sugerencia.score,
          etaEstimadoMin: sugerencia.etaEstimadoMin,
          alternativas: (alternativas ?? []).map((alt) => ({
            armadorId: alt.armadorId,
            score: alt.score,
            etaEstimadoMin: alt.etaEstimadoMin,
          })),
          generadoEn: new Date().toISOString(),
        },
      };

      if (currentEstado === "SIN_ASIGNAR") {
        payload.estado = "ASIGNADO";
      }

      const response = await fetch(`/api/ordenes/${ordenId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "No se pudo confirmar la asignación");
      }

      setMessage("Armador asignado automáticamente.");
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      console.error(err);
      setActionsLocked(false);
      setError(err instanceof Error ? err.message : "Error al asignar armador");
    }
  };

  return (
    <div className="space-y-3 text-sm">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={generarSugerencia}
          disabled={loading || isPending || actionsLocked || isTerminalEstado}
          variant="secondary"
          aria-busy={loading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Generando…
            </span>
          ) : (
            "Asignación automática"
          )}
        </Button>
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Generando…
          </span>
        ) : null}
        {heuristica ? (
          <span className="text-xs text-gray-500">Heurística: {heuristica}</span>
        ) : null}
      </div>

      {isTerminalEstado ? (
        <p className="text-xs text-gray-500">
          La asignación automática está deshabilitada para órdenes completadas o canceladas.
        </p>
      ) : null}

      {sugerencia ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-semibold text-blue-900">Sugerencia principal</p>
          <div className="mt-2 space-y-1 text-sm text-blue-900">
            <p>{sugerencia.nombre}</p>
            {sugerencia.telefono ? (
              <p className="text-xs text-blue-800">Tel: {sugerencia.telefono}</p>
            ) : null}
            <p className="text-xs text-blue-800">
              Score: {sugerencia.score.toFixed(1)} · ETA estimada: {sugerencia.etaEstimadoMin} min
            </p>
          </div>
          <Button
            className="mt-3 w-full bg-vibrant-cyan hover:bg-vibrant-cyan/90"
            onClick={aceptarSugerencia}
            disabled={isPending || actionsLocked}
            aria-busy={isPending}
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Asignando…
              </span>
            ) : (
              "Aceptar sugerencia"
            )}
          </Button>
        </div>
      ) : null}

      {alternativas && alternativas.length > 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <p className="text-xs font-semibold text-gray-700">Otras opciones</p>
          <ul className="mt-2 space-y-1 text-xs text-gray-600">
            {alternativas.map((alt) => (
              <li key={alt.armadorId}>
                {alt.nombre} · Score {alt.score.toFixed(1)} · ETA {alt.etaEstimadoMin} min
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {message ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}
