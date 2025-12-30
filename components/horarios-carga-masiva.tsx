'use client';

import { useState, useRef } from 'react';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { EnhancedCard } from '@/components/ui/enhanced-card';
import { Label } from '@/components/ui/label';
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle,
  Loader2,
  X
} from 'lucide-react';

interface CargaMasivaResult {
  success: boolean;
  created: number;
  updated: number;
  errors: string[];
}

interface Armador {
  id: string;
  nombre: string;
}

const TIPOS_TURNO = [
  { value: 'NORMAL', label: 'Normal', color: 'bg-green-100 text-green-800' },
  { value: 'EXTRA', label: 'Extra', color: 'bg-blue-100 text-blue-800' },
  { value: 'MEDIO_TIEMPO', label: 'Medio Tiempo', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'DESCANSO', label: 'Descanso', color: 'bg-gray-100 text-gray-800' },
  { value: 'INCAPACIDAD', label: 'Incapacidad', color: 'bg-red-100 text-red-800' },
  { value: 'VACACIONES', label: 'Vacaciones', color: 'bg-purple-100 text-purple-800' },
  { value: 'AUSENCIA', label: 'Ausencia', color: 'bg-orange-100 text-orange-800' },
];

export function HorariosCargaMasiva({ armadores }: { armadores: Armador[] }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CargaMasivaResult | null>(null);
  const [showForm, setShowForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    // Generar CSV de plantilla
    const headers = ['armador_id', 'armador_nombre', 'fecha', 'hora_inicio', 'hora_fin', 'tipo_turno', 'notas'];
    const exampleRows = armadores.slice(0, 3).map(a => {
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      return `${a.id},${a.nombre},${dateStr},08:00,17:00,NORMAL,`;
    });
    
    const csvContent = [headers.join(','), ...exampleRows].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_horarios.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/horarios/carga-masiva', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setResult({
          success: false,
          created: 0,
          updated: 0,
          errors: [data.error || 'Error al procesar el archivo'],
        });
      } else {
        setResult(data);
      }
    } catch (error) {
      setResult({
        success: false,
        created: 0,
        updated: 0,
        errors: ['Error de conexión al servidor'],
      });
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <EnhancedCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Carga Masiva de Horarios
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Sube un archivo CSV para programar horarios de múltiples armadores
          </p>
        </div>
        <EnhancedButton
          variant="outline"
          size="sm"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? <X className="w-4 h-4 mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
          {showForm ? 'Cerrar' : 'Cargar Horarios'}
        </EnhancedButton>
      </div>

      {showForm && (
        <div className="space-y-6">
          {/* Instrucciones */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Instrucciones</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• El archivo debe ser CSV con las columnas: armador_id, fecha, hora_inicio, hora_fin, tipo_turno, notas</li>
              <li>• Formato de fecha: YYYY-MM-DD (ej: 2024-01-15)</li>
              <li>• Formato de hora: HH:mm (ej: 08:00, 17:30)</li>
              <li>• Tipos válidos: NORMAL, EXTRA, MEDIO_TIEMPO, DESCANSO, INCAPACIDAD, VACACIONES, AUSENCIA</li>
              <li>• Si ya existe un horario para ese armador/fecha, se actualizará</li>
            </ul>
          </div>

          {/* Tipos de turno disponibles */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Tipos de turno disponibles:</Label>
            <div className="flex flex-wrap gap-2">
              {TIPOS_TURNO.map(tipo => (
                <span key={tipo.value} className={`px-2 py-1 rounded text-xs font-medium ${tipo.color}`}>
                  {tipo.value} = {tipo.label}
                </span>
              ))}
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-4">
            <EnhancedButton
              variant="outline"
              onClick={handleDownloadTemplate}
            >
              <Download className="w-4 h-4 mr-2" />
              Descargar Plantilla
            </EnhancedButton>

            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <EnhancedButton
                variant="default"
                disabled={loading}
                onClick={() => fileInputRef.current?.click()}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Subir Archivo CSV
                  </>
                )}
              </EnhancedButton>
            </div>
          </div>

          {/* Resultado */}
          {result && (
            <div className={`rounded-lg p-4 ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <h4 className={`font-medium ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                    {result.success ? 'Carga completada' : 'Error en la carga'}
                  </h4>
                  {result.success && (
                    <p className="text-sm text-green-800 mt-1">
                      {result.created} horarios creados, {result.updated} actualizados
                    </p>
                  )}
                  {result.errors.length > 0 && (
                    <ul className="text-sm text-red-800 mt-2 space-y-1">
                      {result.errors.map((error, i) => (
                        <li key={i}>• {error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </EnhancedCard>
  );
}
