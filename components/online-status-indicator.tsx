'use client';

import { useState, useEffect } from 'react';
import { WifiOff, Wifi, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function OnlineStatusIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  
  useEffect(() => {
    // Estado inicial
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => {
      setIsOnline(true);
      setShowBanner(true);
      setDismissed(false);
      // Auto-ocultar después de 3 segundos
      setTimeout(() => setShowBanner(false), 3000);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
      setDismissed(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  if (!showBanner || dismissed) return null;
  
  return (
    <div 
      className={cn(
        'fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50',
        'animate-in slide-in-from-bottom-5 duration-300'
      )}
    >
      <div 
        className={cn(
          'flex items-center gap-3 p-4 rounded-lg shadow-lg',
          isOnline 
            ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
        )}
      >
        <div className={cn(
          'flex-shrink-0 p-2 rounded-full',
          isOnline ? 'bg-green-100 dark:bg-green-800' : 'bg-red-100 dark:bg-red-800'
        )}>
          {isOnline ? (
            <Wifi className="h-5 w-5 text-green-600 dark:text-green-400" />
          ) : (
            <WifiOff className="h-5 w-5 text-red-600 dark:text-red-400" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className={cn(
            'text-sm font-medium',
            isOnline ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
          )}>
            {isOnline ? 'Conexión restablecida' : 'Sin conexión a internet'}
          </p>
          <p className={cn(
            'text-xs',
            isOnline ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          )}>
            {isOnline 
              ? 'Sincronizando datos pendientes...' 
              : 'Los cambios se guardarán localmente'
            }
          </p>
        </div>
        
        <button
          onClick={() => setDismissed(true)}
          className={cn(
            'flex-shrink-0 p-1 rounded hover:bg-black/5 dark:hover:bg-white/5',
            isOnline ? 'text-green-600' : 'text-red-600'
          )}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
