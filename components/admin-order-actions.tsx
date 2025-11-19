"use client";

import { Edit, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface AdminOrderActionsProps {
  ordenId: string;
  estado: string;
}

export function AdminOrderActions({ ordenId, estado }: AdminOrderActionsProps) {
  const { toast } = useToast();

  if (["CANCELADA", "RECHAZADO", "ARMADO_COMPLETADO"].includes(estado)) {
    return null;
  }

  const handleEditarOrden = () => {
    toast({
      title: "Edición de orden en desarrollo",
      description: "Pronto podrás editar los datos de la orden desde aquí.",
    });
  };

  const handleInactivarOrden = () => {
    toast({
      title: "Inactivar orden en desarrollo",
      description: "Esta acción estará disponible próximamente.",
    });
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleEditarOrden}>
        <Edit className="h-4 w-4 mr-2" />
        Editar orden
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="border-red-300 text-red-600 hover:bg-red-50"
        onClick={handleInactivarOrden}
      >
        <XCircle className="h-4 w-4 mr-2" />
        Inactivar
      </Button>
    </>
  );
}
