"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface ProyectoDetailActionsProps {
  proyectoId: string;
}

export function ProyectoDetailActions({ proyectoId }: ProyectoDetailActionsProps) {
  const router = useRouter();

  return (
    <>
      <Button 
        variant="default" 
        size="sm"
        onClick={() => router.push(`/admin/proyectos/${proyectoId}/editar`)}
      >
        Editar Proyecto
      </Button>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => router.push("/admin/proyectos")}
      >
        ← Volver a Proyectos
      </Button>
    </>
  );
}
