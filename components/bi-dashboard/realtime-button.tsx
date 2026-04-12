"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { Activity, RefreshCw } from "lucide-react";

interface RealTimeButtonProps {
  isLoading?: boolean;
}

export function RealTimeButton({ isLoading = false }: RealTimeButtonProps) {
  const router = useRouter();
  const [isActive, setIsActive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const handleRefresh = () => {
    router.refresh();
    setLastUpdate(new Date());
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive) {
      interval = setInterval(() => {
        handleRefresh();
      }, 30000); // Actualizar cada 30 segundos
    }

    return () => {
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  const handleToggleRealTime = () => {
    if (isActive) {
      setIsActive(false);
    } else {
      setIsActive(true);
      handleRefresh();
    }
  };

  return (
    <div className="flex items-center space-x-3">
      <EnhancedButton 
        variant={isActive ? "default" : "outline"} 
        size="sm"
        onClick={handleToggleRealTime}
        disabled={isLoading}
        className={`${isActive ? 'bg-green-600 hover:bg-green-700 border-green-600' : ''} transition-colors`}
      >
        {isActive ? (
          <>
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Detener
          </>
        ) : (
          <>
            <Activity className="w-4 h-4 mr-2" />
            Tiempo Real
          </>
        )}
      </EnhancedButton>
      
      {isActive && (
        <div className="text-xs text-gray-500">
          Actualizado: {lastUpdate.toLocaleTimeString('es-ES')}
        </div>
      )}
    </div>
  );
}
