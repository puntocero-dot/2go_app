"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface BillingEmailButtonProps {
  proyectoId: string;
  desde: string;
  hasta: string;
  disabled: boolean;
}

export function BillingEmailButton({
  proyectoId,
  desde,
  hasta,
  disabled,
}: BillingEmailButtonProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);

  const busy = disabled || loading || isPending;

  const handleClick = () => {
    if (busy) return;

    startTransition(async () => {
      try {
        setLoading(true);

        const response = await fetch("/api/facturacion/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ proyectoId, desde, hasta }),
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.error || "No se pudo enviar la facturación");
        }

        toast({
          title: "Facturación enviada",
          description:
            data?.message ||
            "Se envió el resumen de facturación al correo de contacto del proyecto.",
          variant: "success",
        });
      } catch (error) {
        console.error(error);
        toast({
          title: "Error al enviar facturación",
          description:
            error instanceof Error
              ? error.message
              : "Ocurrió un error inesperado al enviar la facturación.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    });
  };

  return (
    <Button
      variant="default"
      size="sm"
      type="button"
      onClick={handleClick}
      disabled={busy}
    >
      {loading || isPending ? "Enviando..." : "Enviar al cliente"}
    </Button>
  );
}
