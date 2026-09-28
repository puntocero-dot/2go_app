"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { EnhancedButton } from "@/components/ui/enhanced-button";

const ESTADOS = ["NUEVO", "CONTACTADO", "CALIFICADO", "CONVERTIDO", "DESCARTADO"] as const;

export function LeadEstadoSelect({ leadId, estadoActual }: { leadId: string; estadoActual: string | null }) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);

  const actualizar = async (estadoLead: string) => {
    setCargando(true);
    try {
      await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estadoLead }),
      });
      router.refresh();
    } finally {
      setCargando(false);
    }
  };

  return (
    <select
      value={estadoActual ?? "NUEVO"}
      disabled={cargando}
      onChange={(e) => actualizar(e.target.value)}
      className="text-xs rounded-md border border-input bg-background px-2 py-1"
    >
      {ESTADOS.map((estado) => (
        <option key={estado} value={estado}>
          {estado}
        </option>
      ))}
    </select>
  );
}

export function ConvertirLeadButton({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);

  const convertir = async () => {
    if (!confirm("¿Convertir este lead en cliente activo? Podrás completar sus datos de facturación después.")) {
      return;
    }
    setCargando(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/convertir`, { method: "POST" });
      if (res.ok) {
        router.push(`/admin/proyectos/${leadId}/editar`);
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <EnhancedButton size="sm" variant="default" disabled={cargando} onClick={convertir}>
      Convertir a cliente
    </EnhancedButton>
  );
}
