"use client";

import { useState, useEffect } from "react";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { Activity, RefreshCw } from "lucide-react";

interface RealTimeButtonProps {
  onRefresh: () => void;
  isLoading?: boolean;
}

export function RealTimeButton({ onRefresh, isLoading = false }: RealTimeButtonProps) {
  const [isActive, setIsActive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive) {
      interval = setInterval(() => {
        onRefresh();
        setLastUpdate(new Date());
      }, 30000); // Actualizar cada 30 segundos
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, onRefresh]);

  const handleToggleRealTime = () => {
    if (isActive) {
      setIsActive(false);
    } else {
      setIsActive(true);
      onRefresh();
      setLastUpdate(new Date());
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
