'use client';

import { cn } from '@/lib/utils';
import { 
  MapPin, 
  AlertCircle, 
  XCircle, 
  Loader2, 
  CheckCircle,
  AlertTriangle 
} from 'lucide-react';

export type GPSState = 
  | 'idle'
  | 'requesting-permission'
  | 'permission-denied'
  | 'locating'
  | 'located'
  | 'error'
  | 'offline';

interface GPSStatusIndicatorProps {
  state: GPSState;
  lastUpdate?: Date;
  failedAttempts?: number;
  queuedPoints?: number;
  className?: string;
  compact?: boolean;
}

const stateConfig: Record<GPSState, {
  icon: typeof MapPin;
  color: string;
  bg: string;
  text: string;
  spin?: boolean;
  pulse?: boolean;
}> = {
  'idle': { 
    icon: MapPin, 
    color: 'text-gray-400', 
    bg: 'bg-gray-50 dark:bg-gray-800',
    text: 'GPS inactivo' 
  },
  'requesting-permission': { 
    icon: AlertCircle, 
    color: 'text-yellow-600', 
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    text: 'Solicitando permisos GPS...',
    pulse: true
  },
  'permission-denied': { 
    icon: XCircle, 
    color: 'text-red-600',
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'Permisos GPS denegados' 
  },
  'locating': { 
    icon: Loader2, 
    color: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'Obteniendo ubicación...',
    spin: true
  },
  'located': { 
    icon: CheckCircle, 
    color: 'text-green-600',
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'GPS activo'
  },
  'error': { 
    icon: AlertTriangle, 
    color: 'text-red-600',
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'Error de GPS'
  },
  'offline': {
    icon: AlertCircle,
    color: 'text-orange-600',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    text: 'Sin conexión - Guardando localmente'
  }
};

export function GPSStatusIndicator({ 
  state, 
  lastUpdate,
  failedAttempts = 0,
  queuedPoints = 0,
  className,
  compact = false
}: GPSStatusIndicatorProps) {
  const config = stateConfig[state];
  const Icon = config.icon;
  
  if (compact) {
    return (
      <div 
        className={cn(
          'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
          config.bg,
          config.color,
          className
        )}
        title={config.text}
      >
        <Icon 
          className={cn(
            'h-3 w-3',
            config.spin && 'animate-spin',
            config.pulse && 'animate-pulse'
          )} 
        />
        <span className="hidden sm:inline">{config.text}</span>
      </div>
    );
  }
  
  return (
    <div className={cn('flex items-center gap-3 p-3 rounded-lg', config.bg, className)}>
      <Icon 
        className={cn(
          'h-5 w-5 flex-shrink-0', 
          config.color,
          config.spin && 'animate-spin',
          config.pulse && 'animate-pulse'
        )} 
      />
      <div className="flex-1 min-w-0">
        <div className={cn('text-sm font-medium', config.color)}>
          {config.text}
        </div>
        
        {lastUpdate && state === 'located' && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Última actualización: {formatTime(lastUpdate)}
          </div>
        )}
        
        {failedAttempts > 0 && (state === 'error' || state === 'offline') && (
          <div className="text-xs text-red-500">
            {failedAttempts} intento{failedAttempts !== 1 ? 's' : ''} fallido{failedAttempts !== 1 ? 's' : ''}
          </div>
        )}
        
        {queuedPoints > 0 && (
          <div className="text-xs text-orange-600 dark:text-orange-400">
            {queuedPoints} ubicacion{queuedPoints !== 1 ? 'es' : ''} pendiente{queuedPoints !== 1 ? 's' : ''} de enviar
          </div>
        )}
      </div>
    </div>
  );
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('es', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date);
}
