"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface OrderDeleteButtonProps {
  ordenId: string;
  currentEstado: string;
}

export function OrderDeleteButton({ ordenId, currentEstado }: OrderDeleteButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    const target =
      currentEstado === "SIN_ASIGNAR"
        ? "eliminar definitivamente la orden"
        : "cancelar la orden (se ocultará del listado)";

    const confirmed = window.confirm(
      `¿Seguro que deseas ${target}? Esta acción no se puede deshacer.`,
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/ordenes/${ordenId}`, {
        method: "DELETE",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "No se pudo eliminar/cancelar la orden");
      }

      startTransition(() => {
        router.push("/admin/ordenes?deleted=1");
      });
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Error al eliminar/cancelar la orden",
      );
    } finally {
      setLoading(false);
    }
  };

  const busy = loading || isPending;

  return (
    <div className="flex flex-col gap-2 text-sm">
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={handleDelete}
        disabled={busy}
      >
        {currentEstado === "SIN_ASIGNAR"
          ? "Eliminar orden"
          : "Cancelar / ocultar orden"}
      </Button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
