"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCcw } from "lucide-react";

interface DashboardRefresherProps {
  intervalMs?: number;
}

export function DashboardRefresher({ intervalMs = 180000 }: DashboardRefresherProps) {
  const router = useRouter();
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsRefreshing(true);
      router.refresh();
      setLastRefresh(new Date());
      
      // Simular un pequeño delay visual para el icono de refresco
      setTimeout(() => setIsRefreshing(false), 1000);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [router, intervalMs]);

  return (
    <div className="fixed bottom-4 right-4 flex items-center space-x-2 bg-white/80 backdrop-blur-sm border border-gray-200 px-3 py-1.5 rounded-full shadow-sm text-[10px] text-muted-foreground z-50">
      <RefreshCcw className={`w-3 h-3 ${isRefreshing ? "animate-spin text-blue-500" : ""}`} />
      <span>
        Actualización automática: {lastRefresh.toLocaleTimeString("es-SV", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "America/El_Salvador",
        })}
      </span>
    </div>
  );
}
