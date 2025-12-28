'use client';

import { WifiOff, RefreshCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800">
          <WifiOff className="h-10 w-10 text-gray-400" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Sin conexión a internet
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            No se puede conectar al servidor. Algunas funciones están limitadas.
          </p>
        </div>
        
        <div className="space-y-3">
          <button 
            onClick={() => typeof window !== 'undefined' && window.location.reload()}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-madera-natural text-white rounded-lg hover:bg-madera-natural/90 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Reintentar conexión
          </button>
          
          <Link 
            href="/"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
        </div>
        
        <div className="text-sm text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="font-medium mb-2">Funciones disponibles offline:</p>
          <ul className="space-y-1 text-left">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Ver datos cargados previamente
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Navegación básica en cache
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
              GPS se sincronizará al reconectar
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
