"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Navigation, Clock, CheckCircle, Loader2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ArmadorCerrarOrdenDialog } from "@/components/armador-cerrar-orden-dialog";
import { useToast } from "@/hooks/use-toast";
import { getEstadoLabel } from "@/lib/orden-helpers";
import { cn } from "@/lib/utils";

interface ArmadorEstadoActionsProps {
  ordenId: string;
  estado: string;
}

export function ArmadorEstadoActions({
  ordenId,
  estado,
}: ArmadorEstadoActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCerrarDialog, setShowCerrarDialog] = useState(false);
  const { toast } = useToast();

  const obtenerGps = useCallback(async () => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      return undefined;
    }

    return new Promise<{ latitud: number; longitud: number } | undefined>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitud: pos.coords.latitude,
            longitud: pos.coords.longitude,
          });
        },
        () => resolve(undefined),
        {
          enableHighAccuracy: true,
          timeout: 10000,
        },
      );
    });
  }, []);

  const handleCambiarEstado = useCallback(
    async (nuevoEstado: string) => {
      if (isLoading) return;

      try {
        setIsLoading(true);
        setError(null);

        const gps = await obtenerGps();

        const res = await fetch(`/api/ordenes/${ordenId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            gps
              ? {
                  estado: nuevoEstado,
                  gps,
                }
              : { estado: nuevoEstado },
          ),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(data?.error || "Error al actualizar estado");
        }

        toast({
          title: "Estado actualizado",
          description: `Orden marcada como ${getEstadoLabel(nuevoEstado)}`,
        });

        startTransition(() => {
          router.refresh();
        });
      } catch (e) {
        console.error(e);
        setError(
          e instanceof Error ? e.message : "Error al actualizar el estado de la orden",
        );
        toast({
          title: "Error al actualizar estado",
          description:
            e instanceof Error ? e.message : "Error al actualizar el estado de la orden",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, obtenerGps, ordenId, router],
  );

  const busy = isLoading || isPending;

  if (estado === "ASIGNADO") {
    return (
      <div className="flex flex-col gap-1">
        <Button
          size="lg"
          className={cn(
            "w-full sm:w-auto sm:min-w-[280px] shadow-md bg-vibrant-cyan hover:bg-vibrant-cyan/90",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
          onClick={() => handleCambiarEstado("EN_RUTA")}
          disabled={busy}
        >
          {busy ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Iniciando...
            </>
          ) : (
            <>
              <Navigation className="mr-2 h-5 w-5" />
              Iniciar ruta
            </>
          )}
        </Button>
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
      </div>
    );
  }

  if (estado === "EN_RUTA") {
    return (
      <div className="flex flex-col gap-1">
        <Button
          size="lg"
          className={cn(
            "w-full sm:w-auto sm:min-w-[280px] shadow-md bg-vibrant-cyan hover:bg-vibrant-cyan/90",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
          onClick={() => handleCambiarEstado("ARMADO_INICIADO")}
          disabled={busy}
        >
          {busy ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Iniciando armado...
            </>
          ) : (
            <>
              <Clock className="mr-2 h-5 w-5" />
              Iniciar armado
            </>
          )}
        </Button>
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
      </div>
    );
  }

  if (estado === "ARMADO_INICIADO" || estado === "ARMADO_FINALIZADO") {
    return (
      <div className="flex flex-col gap-1">
        <Button
          size="lg"
          className={cn(
            "w-full sm:w-auto sm:min-w-[280px] shadow-md bg-vibrant-cyan hover:bg-vibrant-cyan/90",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
          onClick={() => setShowCerrarDialog(true)}
          disabled={busy}
        >
          <CheckCircle className="mr-2 h-5 w-5" />
          Completar orden
        </Button>
        {error ? <p className="text-xs text-red-600">{error}</p> : null}

        <ArmadorCerrarOrdenDialog
          ordenId={ordenId}
          open={showCerrarDialog}
          onOpenChange={setShowCerrarDialog}
          onCompleted={() => {
            setShowCerrarDialog(false);
            startTransition(() => {
              router.refresh();
            });
          }}
        />
      </div>
    );
  }

  if (estado === "CANCELADA") {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-700 bg-gray-100 px-4 py-3 rounded-lg">
        <XCircle className="h-5 w-5 text-gray-500" />
        <span className="font-medium">
          Esta orden fue cancelada por el administrador. No necesitas realizar este servicio.
        </span>
      </div>
    );
  }

  if (estado === "ARMADO_COMPLETADO") {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 px-4 py-3 rounded-lg">
        <CheckCircle className="h-5 w-5" />
        <span className="font-medium">Orden completada exitosamente</span>
      </div>
    );
  }

  return <span className="text-xs text-gray-400">Sin acciones</span>;
}
