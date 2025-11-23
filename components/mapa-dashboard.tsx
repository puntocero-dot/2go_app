'use client';

import { useMemo, useState } from 'react';
import MapaWrapper from '@/components/mapa-wrapper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

type Armador = {
  id: string;
  nombre: string;
  lat: number;
  lng: number;
  estado: string;
};

type Orden = {
  id: string;
  codigoReferenciaRetail: string;
  estado: string;
  lat: number;
  lng: number;
  direccion: string;
  municipio: string;
  armadorNombre: string;
  proyectoId: string;
  proyectoNombre: string;
};

type Props = {
  armadores: Armador[];
  ordenes: Orden[];
};

const ESTADOS_OPCIONES = [
  { value: 'ALL', label: 'Todos los estados' },
  { value: 'ARMADO_INICIADO', label: 'En armado' },
  { value: 'EN_RUTA', label: 'En ruta' },
  { value: 'ASIGNADO', label: 'Asignadas' },
];

export default function MapaDashboard({ armadores, ordenes }: Props) {
  const [proyectoId, setProyectoId] = useState<string>('ALL');
  const [estado, setEstado] = useState<string>('ALL');

  const proyectos = useMemo(
    () => {
      const map = new Map<string, string>();
      ordenes.forEach((o) => {
        if (!map.has(o.proyectoId)) {
          map.set(o.proyectoId, o.proyectoNombre);
        }
      });
      return Array.from(map.entries()).map(([id, nombre]) => ({ id, nombre }));
    },
    [ordenes]
  );

  const filteredOrdenes = useMemo(
    () =>
      ordenes.filter((o) => {
        const byProyecto = proyectoId === 'ALL' || o.proyectoId === proyectoId;
        const byEstado = estado === 'ALL' || o.estado === estado;
        return byProyecto && byEstado;
      }),
    [ordenes, proyectoId, estado]
  );

  const stats = useMemo(
    () => ({
      armadoresActivos: armadores.length,
      ordenesEnProgreso: filteredOrdenes.filter((o) => o.estado === 'ARMADO_INICIADO').length,
      ordenesEnRuta: filteredOrdenes.filter((o) => o.estado === 'EN_RUTA').length,
      ordenesAsignadas: filteredOrdenes.filter((o) => o.estado === 'ASIGNADO').length,
    }),
    [armadores.length, filteredOrdenes]
  );

  const ordenesForMapa = useMemo(
    () =>
      filteredOrdenes.map(({ proyectoId: _proyectoId, ...rest }) => rest),
    [filteredOrdenes]
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Armadores Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.armadoresActivos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              En Armado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.ordenesEnProgreso}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              En Ruta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.ordenesEnRuta}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Asignadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.ordenesAsignadas}</div>
          </CardContent>
        </Card>
      </div>

      {/* Mapa */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Mapa en Tiempo Real</CardTitle>
          <CardDescription>Armadores activos y órdenes según filtros seleccionados</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <MapaWrapper armadores={armadores} ordenes={ordenesForMapa} />
        </CardContent>
      </Card>

      {/* Leyenda */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Leyenda</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500" />
            <span className="text-sm">Armador Activo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500" />
            <span className="text-sm">Orden en Armado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500" />
            <span className="text-sm">Orden en Ruta</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-orange-500" />
            <span className="text-sm">Orden Asignada</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
