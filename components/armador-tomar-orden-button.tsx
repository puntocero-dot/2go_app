"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface ArmadorTomarOrdenButtonProps {
  ordenId: string;
}

export function ArmadorTomarOrdenButton({ ordenId }: ArmadorTomarOrdenButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    const confirmed = window.confirm(
      "¿Deseas tomar esta orden? Se te asignará para su atención.",
    );
    if (!confirmed) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/ordenes/${ordenId}/tomar`, {
        method: "POST",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "No se pudo tomar la orden");
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Error al intentar tomar la orden",
      );
    } finally {
      setLoading(false);
    }
  };

  const busy = loading || isPending;

  return (
    <div className="flex flex-col gap-1 text-sm">
      <Button
        type="button"
        size="sm"
        className="bg-vibrant-cyan hover:bg-vibrant-cyan/90"
        onClick={handleClick}
        disabled={busy}
      >
        Tomar pedido
      </Button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
