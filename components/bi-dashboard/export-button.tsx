"use client";

import { useState } from "react";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { Download, FileText, Table } from "lucide-react";
import { addToast } from "@/components/ui/toaster";

interface ExportButtonProps {
  proyectoId?: string;
  fechaInicio?: string;
  fechaFin?: string;
}

export function ExportButton({ proyectoId, fechaInicio, fechaFin }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleExport = async (format: 'csv' | 'pdf') => {
    setLoading(true);
    setShowMenu(false);

    try {
      const params = new URLSearchParams();
      if (proyectoId && proyectoId !== 'ALL') params.append('proyectoId', proyectoId);
      if (fechaInicio) params.append('fechaInicio', fechaInicio);
      if (fechaFin) params.append('fechaFin', fechaFin);
      params.append('format', format);

      const response = await fetch(`/api/reportes/bi-export?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Error al exportar reporte');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-bi-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error:', error);
      addToast({ title: "Error al exportar reporte", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <EnhancedButton 
        variant="outline" 
        size="sm"
        onClick={() => setShowMenu(!showMenu)}
        disabled={loading}
      >
        <Download className="w-4 h-4 mr-2" />
        {loading ? 'Exportando...' : 'Exportar Reporte'}
      </EnhancedButton>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
          <button
            onClick={() => handleExport('csv')}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-sm"
          >
            <Table className="w-4 h-4" />
            Exportar como CSV
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-sm"
          >
            <FileText className="w-4 h-4" />
            Exportar como PDF
          </button>
        </div>
      )}
    </div>
  );
}
