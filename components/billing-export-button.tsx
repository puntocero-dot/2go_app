'use client';

import { useState } from 'react';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';

interface BillingExportButtonProps {
  proyectoId: string;
  desde: string;
  hasta: string;
  disabled?: boolean;
}

export function BillingExportButton({ proyectoId, desde, hasta, disabled }: BillingExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleExport = async (format: 'csv' | 'pdf') => {
    setLoading(true);
    setIsOpen(false);

    try {
      const endpoint = format === 'csv' ? '/api/facturacion/export' : '/api/facturacion/pdf';
      const params = new URLSearchParams({
        proyectoId,
        desde,
        hasta,
      });

      const response = await fetch(`${endpoint}?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Error al exportar');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Obtener el nombre del archivo del header Content-Disposition
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `facturacion_${proyectoId}_${desde}_${hasta}.${format}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Error al exportar. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative inline-block">
      <EnhancedButton
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || loading}
      >
        <Download className="w-4 h-4 mr-2" />
        {loading ? 'Exportando...' : 'Exportar'}
      </EnhancedButton>

      {isOpen && !loading && (
        <>
          {/* Overlay para cerrar el dropdown */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown menu */}
          <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
            <div className="py-1" role="menu">
              <button
                onClick={() => handleExport('csv')}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                role="menuitem"
              >
                <FileSpreadsheet className="w-4 h-4 mr-3 text-green-600" />
                Exportar como CSV
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                role="menuitem"
              >
                <FileText className="w-4 h-4 mr-3 text-red-600" />
                Exportar como PDF
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
