"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ArmadorOption {
  id: string;
  nombre: string;
  telefono: string | null;
  estado: string;
  ordenesActivas: number;
}

interface AssignArmadorCardProps {
  ordenId: string;
  currentArmadorId?: string | null;
  currentArmadorNombre?: string | null;
  currentArmadorTelefono?: string | null;
  currentEstado: string;
}

export function AssignArmadorCard({
  ordenId,
  currentArmadorId,
  currentArmadorNombre,
  currentArmadorTelefono,
  currentEstado,
}: AssignArmadorCardProps) {
  const router = useRouter();
  const [armadores, setArmadores] = useState<ArmadorOption[]>([]);
  const [selectedArmador, setSelectedArmador] = useState<string>(
    currentArmadorId ?? ""
  );
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<
    { type: "success" | "error"; message: string } | null
  >(null);
  const [isPending, startTransition] = useTransition();
  const isTerminalEstado =
    currentEstado === "ARMADO_COMPLETADO" ||
    currentEstado === "CANCELADA" ||
    currentEstado === "RECHAZADO";

  useEffect(() => {
    const fetchArmadores = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/armadores", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("No se pudieron obtener los armadores disponibles");
        }
        const data = await response.json();
        setArmadores(data.armadores ?? []);
      } catch (error) {
        console.error(error);
        setFeedback({
          type: "error",
          message: "Error cargando armadores. Intenta nuevamente.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchArmadores();
  }, []);

  const handleAssign = async (event: React.FormEvent) => {
    event.preventDefault();
    setFeedback(null);

    if (!selectedArmador) {
      setFeedback({
        type: "error",
        message: "Selecciona un armador para continuar.",
      });
      return;
    }

    try {
      const payload: Record<string, unknown> = {
        armadorId: selectedArmador,
      };

      if (currentEstado === "SIN_ASIGNAR") {
        payload.estado = "ASIGNADO";
      }

      const response = await fetch(`/api/ordenes/${ordenId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "No se pudo asignar el armador");
      }

      setFeedback({
        type: "success",
        message: "Armador asignado correctamente.",
      });

      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error(error);
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Error inesperado.",
      });
    }
  };

  const hasArmadores = armadores.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Asignación manual</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-gray-700">
        <div className="space-y-2">
          <p className="font-semibold text-gray-900">Armador actual</p>
          {currentArmadorId ? (
            <div>
              <p>{currentArmadorNombre}</p>
              {currentArmadorTelefono ? (
                <p className="text-xs text-gray-500">Tel: {currentArmadorTelefono}</p>
              ) : null}
            </div>
          ) : (
            <p className="text-gray-500">Esta orden aún no tiene armador asignado.</p>
          )}
        </div>

        <form onSubmit={handleAssign} className="space-y-3">
          <div className="space-y-2">
            <label htmlFor="armador" className="font-semibold text-gray-900">
              Seleccionar armador
            </label>
            <select
              id="armador"
              value={selectedArmador}
              onChange={(event) => setSelectedArmador(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-vibrant-cyan focus:outline-none focus:ring-2 focus:ring-vibrant-cyan/20"
              disabled={loading || !hasArmadores || isPending || isTerminalEstado}
            >
              <option value="">Selecciona un armador</option>
              {armadores.map((armador) => (
                <option key={armador.id} value={armador.id}>
                  {armador.nombre} · {armador.ordenesActivas} asignadas
                </option>
              ))}
            </select>
            {!hasArmadores && !loading ? (
              <p className="text-xs text-red-600">
                No hay armadores activos disponibles. Revisa la sección de armadores.
              </p>
            ) : null}
          </div>

          <Button
            type="submit"
            className="w-full bg-vibrant-cyan hover:bg-vibrant-cyan/90"
            disabled={!hasArmadores || loading || isPending || isTerminalEstado}
          >
            {isPending ? "Asignando..." : "Asignar armador"}
          </Button>
        </form>

        {isTerminalEstado ? (
          <p className="text-xs text-gray-500">
            La orden está completada o cancelada. No se puede cambiar el armador.
          </p>
        ) : null}

        {feedback ? (
          <div
            className={`rounded-md border px-3 py-2 text-sm ${
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {feedback.message}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
