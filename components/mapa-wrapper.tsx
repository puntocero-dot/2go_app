'use client';

import dynamic from 'next/dynamic';

const MapaArmadores = dynamic(
  () => import('./mapa-armadores').then((mod) => mod.default),
  { 
    ssr: false,
    loading: () => (
      <div className="h-[600px] flex items-center justify-center bg-muted">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando mapa...</p>
        </div>
      </div>
    )
  }
);

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
  proyectoNombre: string;
};

type Props = {
  armadores: Armador[];
  ordenes: Orden[];
};

export default function MapaWrapper({ armadores, ordenes }: Props) {
  return <MapaArmadores armadores={armadores} ordenes={ordenes} />;
}
