'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, Download } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { getProyectosParaFiltros, getArmadoresParaFiltros, ResultadoReporte, EstadoOrden } from '@/lib/reportes';

// Definir los estados posibles para los filtros
const ESTADOS_ORDEN: EstadoOrden[] = [
  'SIN_ASIGNAR',
  'ASIGNADO',
  'EN_RUTA',
  'ARMADO_INICIADO',
  'ARMADO_FINALIZADO',
  'ARMADO_COMPLETADO',
  'CANCELADA',
];

// Función para formatear segundos a un string legible
const formatSeconds = (seconds: number): string => {
  if (isNaN(seconds)) return '0s';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  
  return parts.join(' ');
};

export default function ReporteTiemposPedidoPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ResultadoReporte[]>([]);
  const [proyectos, setProyectos] = useState<{id: string, nombreComercial: string}[]>([]);
  const [armadores, setArmadores] = useState<{id: string, nombre: string, apellido: string}[]>([]);
  
  // Filtros
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [proyectoId, setProyectoId] = useState<string>('');
  const [estado, setEstado] = useState<string>('');
  const [armadorId, setArmadorId] = useState<string>('');

  // Cargar datos iniciales
  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin');
    }

    if (status === 'authenticated') {
      // Cargar proyectos y armadores para los filtros
      Promise.all([
        getProyectosParaFiltros(),
        getArmadoresParaFiltros(),
      ]).then(([proyectosData, armadoresData]) => {
        setProyectos(proyectosData);
        setArmadores(armadoresData);
        setLoading(false);
      });
    }
  }, [status]);

  // Función para obtener los datos del reporte
  const fetchReportData = async () => {
    setLoading(true);
    try {
      // Construir la URL con los parámetros de consulta
      const params = new URLSearchParams();
      
      if (dateRange?.from) {
        params.append('desde', format(dateRange.from, 'yyyy-MM-dd'));
      }
      if (dateRange?.to) {
        params.append('hasta', format(dateRange.to, 'yyyy-MM-dd'));
      }
      if (proyectoId) {
        params.append('proyectoId', proyectoId);
      }
      if (estado) {
        params.append('estado', estado);
      }
      if (armadorId) {
        params.append('armadorId', armadorId);
      }

      const response = await fetch(`/api/reportes/tiempos-pedido?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar el reporte');
      }

      const data = await response.json();
      setReportData(data);
    } catch (error) {
      console.error('Error al cargar el reporte:', error);
      // Aquí podrías mostrar un mensaje de error al usuario
    } finally {
      setLoading(false);
    }
  };

  // Calcular métricas resumidas
  const calcularMetricas = () => {
    const totalOrdenes = reportData.length;
    let tiempoPromedioTotal = 0;
    const tiempoPorEstado: Record<string, number> = {};
    
    if (totalOrdenes > 0) {
      // Inicializar tiempos por estado
      ESTADOS_ORDEN.forEach(estado => {
        tiempoPorEstado[estado] = 0;
      });
      
      // Sumar tiempos
      reportData.forEach(orden => {
        tiempoPromedioTotal += orden.tiempoTotal;
        
        Object.entries(orden.tiemposPorEstado).forEach(([estado, tiempo]) => {
          if (tiempoPorEstado[estado] !== undefined) {
            tiempoPorEstado[estado] += tiempo;
          }
        });
      });
      
      // Calcular promedios
      tiempoPromedioTotal = tiempoPromedioTotal / totalOrdenes;
      
      // Calcular porcentajes
      const tiempoTotal = Object.values(tiempoPorEstado).reduce((sum, tiempo) => sum + tiempo, 0);
      const porcentajesPorEstado: Record<string, number> = {};
      
      if (tiempoTotal > 0) {
        Object.entries(tiempoPorEstado).forEach(([estado, tiempo]) => {
          porcentajesPorEstado[estado] = (tiempo / tiempoTotal) * 100;
        });
      }
      
      return {
        totalOrdenes,
        tiempoPromedioTotal,
        tiempoPorEstado,
        porcentajesPorEstado,
      };
    }
    
    return {
      totalOrdenes: 0,
      tiempoPromedioTotal: 0,
      tiempoPorEstado: {},
      porcentajesPorEstado: {},
    };
  };
  
  const metricas = calcularMetricas();
  
  // Función para exportar a CSV
  const exportToCSV = () => {
    if (reportData.length === 0) return;
    
    // Encabezados del CSV
    const headers = [
      'ID Orden',
      'Código Referencia',
      'Proyecto',
      'Armador',
      'Estado Actual',
      'Fecha Creación',
      'Fecha Completado',
      ...ESTADOS_ORDEN.map(e => `Tiempo ${e}`),
      'Tiempo Total (s)',
      'Tiempo Total (formateado)',
    ];
    
    // Filas de datos
    const rows = reportData.map(orden => {
      const tiempos = ESTADOS_ORDEN.map(e => (orden.tiemposPorEstado[e] || 0).toFixed(2));
      
      return [
        orden.ordenId,
        `"${orden.codigoReferenciaRetail}"`,
        `"${orden.proyecto}"`,
        `"${orden.armador || 'N/A'}"`,
        `"${orden.estadoActual}"`,
        `"${format(new Date(orden.fechaCreacion), 'yyyy-MM-dd HH:mm:ss')}"`,
        orden.fechaCompletado ? `"${format(new Date(orden.fechaCompletado), 'yyyy-MM-dd HH:mm:ss')}"` : 'N/A',
        ...tiempos,
        orden.tiempoTotal.toFixed(2),
        `"${formatSeconds(orden.tiempoTotal)}"`,
      ];
    });
    
    // Crear contenido CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');
    
    // Crear y descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_tiempos_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (status === 'loading' || loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Reporte de Tiempos por Pedido</h1>
        <Button onClick={exportToCSV} disabled={reportData.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Exportar a CSV
        </Button>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Seleccione los criterios de búsqueda</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <Label htmlFor="fecha">Rango de fechas</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="fecha"
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !dateRange && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, 'LLL dd, y', { locale: es })} -{' '}
                          {format(dateRange.to, 'LLL dd, y', { locale: es })}
                        </>
                      ) : (
                        format(dateRange.from, 'LLL dd, y', { locale: es })
                      )
                    ) : (
                      <span>Seleccione un rango de fechas</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label htmlFor="proyecto">Proyecto</Label>
              <Select value={proyectoId} onValueChange={setProyectoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los proyectos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los proyectos</SelectItem>
                  {proyectos.map(proyecto => (
                    <SelectItem key={proyecto.id} value={proyecto.id}>
                      {proyecto.nombreComercial}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="estado">Estado</Label>
              <Select value={estado} onValueChange={setEstado}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los estados</SelectItem>
                  {ESTADOS_ORDEN.map(estado => (
                    <SelectItem key={estado} value={estado}>
                      {estado.split('_').map(word => 
                        word.charAt(0) + word.slice(1).toLowerCase()
                      ).join(' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="armador">Armador</Label>
              <Select value={armadorId} onValueChange={setArmadorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los armadores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los armadores</SelectItem>
                  {armadores.map(armador => (
                    <SelectItem key={armador.id} value={armador.id}>
                      {armador.nombre} {armador.apellido}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button onClick={fetchReportData} disabled={loading}>
              {loading ? 'Cargando...' : 'Aplicar Filtros'}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {reportData.length > 0 ? (
        <Tabs defaultValue="tabla" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-xs mb-4">
            <TabsTrigger value="tabla">Vista de Tabla</TabsTrigger>
            <TabsTrigger value="resumen">Resumen</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tabla">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Resultados</CardTitle>
                    <CardDescription>
                      Mostrando {reportData.length} {reportData.length === 1 ? 'orden' : 'órdenes'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Orden</TableHead>
                        <TableHead>Proyecto</TableHead>
                        <TableHead>Armador</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Creación</TableHead>
                        {ESTADOS_ORDEN.map(estado => (
                          <TableHead key={estado} className="text-center">
                            {estado.split('_').map(word => 
                              word.charAt(0) + word.slice(1).toLowerCase()
                            ).join(' ')}
                          </TableHead>
                        ))}
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.map((orden) => (
                        <TableRow key={orden.ordenId}>
                          <TableCell className="font-medium">
                            {orden.codigoReferenciaRetail}
                          </TableCell>
                          <TableCell>{orden.proyecto}</TableCell>
                          <TableCell>{orden.armador || 'N/A'}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {orden.estadoActual.split('_').map(word => 
                                word.charAt(0) + word.slice(1).toLowerCase()
                              ).join(' ')}
                            </span>
                          </TableCell>
                          <TableCell>
                            {format(new Date(orden.fechaCreacion), 'dd/MM/yyyy HH:mm', { locale: es })}
                          </TableCell>
                          {ESTADOS_ORDEN.map(estado => (
                            <TableCell key={estado} className="text-center">
                              {orden.tiemposPorEstado[estado] 
                                ? formatSeconds(orden.tiemposPorEstado[estado]!)
                                : '-'}
                            </TableCell>
                          ))}
                          <TableCell className="text-right font-medium">
                            {formatSeconds(orden.tiempoTotal)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="resumen">
            <Card>
              <CardHeader>
                <CardTitle>Resumen de Tiempos</CardTitle>
                <CardDescription>
                  Análisis de los tiempos de procesamiento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3 mb-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Órdenes Totales</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{metricas.totalOrdenes}</div>
                      <p className="text-xs text-muted-foreground">
                        en el período seleccionado
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatSeconds(metricas.tiempoPromedioTotal)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        por orden
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Tiempo Total</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatSeconds(reportData.reduce((sum, orden) => sum + orden.tiempoTotal, 0))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        tiempo total acumulado
                      </p>
                    </CardContent>
                  </Card>
                </div>
                
                <h3 className="text-lg font-semibold mb-4">Distribución de Tiempos por Estado</h3>
                <div className="space-y-4">
                  {Object.entries(metricas.porcentajesPorEstado)
                    .filter(([_, porcentaje]) => porcentaje > 0)
                    .sort((a, b) => b[1] - a[1])
                    .map(([estado, porcentaje]) => (
                      <div key={estado} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">
                            {estado.split('_').map(word => 
                              word.charAt(0) + word.slice(1).toLowerCase()
                            ).join(' ')}
                          </span>
                          <span>{porcentaje.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${porcentaje}%` }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatSeconds(metricas.tiempoPorEstado[estado] || 0)}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {loading ? 'Cargando datos...' : 'No se encontraron órdenes con los filtros seleccionados.'}
            </p>
            {!loading && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={fetchReportData}
              >
                Reintentar
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
