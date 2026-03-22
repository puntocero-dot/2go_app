"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const RutaSugeridaCard = dynamic(() => import("./ruta-sugerida-card").then(mod => ({ default: mod.RutaSugeridaCard })), {
  loading: () => <div className="h-48 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>,
  ssr: false,
});

interface RutaSugeridaCardLazyProps {
  ordenId: string;
  destino: {
    lat: number;
    lng: number;
    direccion?: string;
  };
  origen?: {
    lat: number;
    lng: number;
  } | null;
}

export function RutaSugeridaCardLazy(props: RutaSugeridaCardLazyProps) {
  return <RutaSugeridaCard {...props} />;
}
