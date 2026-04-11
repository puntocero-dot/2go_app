'use client';

import { useState, useCallback, useEffect } from 'react';
import Map, { Source, Layer } from 'react-map-gl';
import Marker from 'react-map-gl/dist/esm/components/marker';
import Popup from 'react-map-gl/dist/esm/components/popup';
import NavigationControl from 'react-map-gl/dist/esm/components/navigation-control';
import FullscreenControl from 'react-map-gl/dist/esm/components/fullscreen-control';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

type RutaPoint = {
  lat: number;
  lng: number;
  timestamp: string;
};

type RutaAnalisis = {
  totalDistanciaKm: number;
  maxSpeedKmh: number;
  paradasLargas: any[];
  eventosVelocidad: any[];
  estuvoEnCliente: boolean;
};

type RutaInfo = {
  ruta: RutaPoint[];
  analisis?: RutaAnalisis;
};

export default function MapaArmadores({ armadores, ordenes }: Props) {
  const [popupInfo, setPopupInfo] = useState<any>(null);
  const [rutaByArmador, setRutaByArmador] = useState<Record<string, RutaInfo>>({});
  const [selectedRouteArmadorId, setSelectedRouteArmadorId] = useState<string | null>(null);
  const [viewState, setViewState] = useState({
    longitude: -89.2182, // San Salvador
    latitude: 13.6929,
    zoom: 12
  });

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // Hooks SIEMPRE antes de cualquier early return (regla de React Hooks)
  useEffect(() => {
    const loadRutas = async () => {
      try {
        const res = await fetch('/api/armadores/mapa');
        if (!res.ok) return;
        const data = await res.json();
        if (!data?.armadores) return;

        const map: Record<string, RutaInfo> = {};
        for (const a of data.armadores as any[]) {
          map[a.id] = {
            ruta: Array.isArray(a.ruta) ? a.ruta : [],
            analisis: a.analisis,
          };
        }
        setRutaByArmador(map);
      } catch (error) {
        console.error('Error cargando rutas de armadores:', error);
      }
    };

    loadRutas();
  }, []);

  // Early return DESPUES de todos los hooks
  if (!mapboxToken) {
    return (
      <div className="h-[600px] flex items-center justify-center bg-muted border-2 border-dashed border-gray-300 rounded-lg">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Mapa no configurado
          </h3>
          <p className="text-gray-600 mb-4">
            Se requiere una API key de Mapbox para mostrar el mapa.
          </p>
          <div className="bg-gray-100 rounded-lg p-3 text-sm text-gray-700">
            <p className="font-mono">NEXT_PUBLIC_MAPBOX_TOKEN</p>
            <p className="text-xs mt-1">Agrega esta variable en tu archivo .env</p>
          </div>
        </div>
      </div>
    );
  }

  const getMarkerColor = (tipo: 'armador' | 'orden', estado: string) => {
    if (tipo === 'armador') {
      return estado === 'ACTIVO' ? '#22c55e' : '#ef4444';
    }
    // Para órdenes
    switch (estado) {
      case 'ARMADO_INICIADO': return '#3b82f6';
      case 'EN_RUTA': return '#eab308';
      case 'ASIGNADO': return '#f97316';
      default: return '#6b7280';
    }
  };

  return (
    <div className="relative h-[600px] w-full">
      <Map
        {...viewState}
        onMove={(evt: any) => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={mapboxToken}
      >
        {/* Controles */}
        <NavigationControl position="top-right" />
        <FullscreenControl position="top-right" />

        {selectedRouteArmadorId && rutaByArmador[selectedRouteArmadorId] &&
          rutaByArmador[selectedRouteArmadorId].ruta.length > 1 && (
            <Source
              id="ruta-armador"
              type="geojson"
              data={{
                type: 'Feature',
                geometry: {
                  type: 'LineString',
                  coordinates: rutaByArmador[selectedRouteArmadorId].ruta.map((p) => [p.lng, p.lat]),
                },
                properties: {},
              }}
            >
              <Layer
                id="ruta-armador-line"
                type="line"
                paint={{
                  'line-color': '#2563eb',
                  'line-width': 3,
                  'line-opacity': 0.8,
                }}
              />
            </Source>
          )}

        {/* Marcadores de Armadores */}
        {armadores.map(armador => (
          <Marker
            key={`armador-${armador.id}`}
            longitude={armador.lng}
            latitude={armador.lat}
            onClick={(e: any) => {
              e.originalEvent.stopPropagation();
              setPopupInfo({ tipo: 'armador', data: armador });
            }}
          >
            <div 
              className="cursor-pointer relative"
              style={{
                width: 30,
                height: 30,
                backgroundColor: getMarkerColor('armador', armador.estado),
                borderRadius: '50%',
                border: '3px solid white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                A
              </div>
            </div>
          </Marker>
        ))}

        {/* Marcadores de Órdenes */}
        {ordenes.map(orden => (
          <Marker
            key={`orden-${orden.id}`}
            longitude={orden.lng}
            latitude={orden.lat}
            onClick={(e: any) => {
              e.originalEvent.stopPropagation();
              setPopupInfo({ tipo: 'orden', data: orden });
            }}
          >
            <div 
              className="cursor-pointer relative"
              style={{
                width: 24,
                height: 24,
                backgroundColor: getMarkerColor('orden', orden.estado),
                borderRadius: '50%',
                border: '2px solid white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}
            />
          </Marker>
        ))}

        {/* Popup */}
        {popupInfo && (
          <Popup
            longitude={popupInfo.tipo === 'armador' ? popupInfo.data.lng : popupInfo.data.lng}
            latitude={popupInfo.tipo === 'armador' ? popupInfo.data.lat : popupInfo.data.lat}
            anchor="top"
            onClose={() => setPopupInfo(null)}
          >
            {popupInfo.tipo === 'armador' ? (
              <div className="p-2 min-w-[200px]">
                <h3 className="font-semibold mb-1">🧑‍🔧 {popupInfo.data.nombre}</h3>
                <Badge variant={popupInfo.data.estado === 'ACTIVO' ? 'default' : 'destructive'}>
                  {popupInfo.data.estado}
                </Badge>
                {rutaByArmador[popupInfo.data.id] && (
                  <div className="mt-2 space-y-1 text-xs text-gray-700">
                    <div>
                      Distancia total:{' '}
                      {rutaByArmador[popupInfo.data.id].analisis?.totalDistanciaKm?.toFixed(1) ?? '0.0'} km
                    </div>
                    <div>
                      Velocidad máx:{' '}
                      {rutaByArmador[popupInfo.data.id].analisis?.maxSpeedKmh?.toFixed(0) ?? '0'} km/h
                    </div>
                    <div>
                      Paradas largas:{' '}
                      {rutaByArmador[popupInfo.data.id].analisis?.paradasLargas?.length ?? 0}
                    </div>
                    <div>
                      En ubicación de cliente:{' '}
                      {rutaByArmador[popupInfo.data.id].analisis?.estuvoEnCliente ? 'Sí' : 'No'}
                    </div>
                    {rutaByArmador[popupInfo.data.id].ruta.length > 1 && (
                      <button
                        className="mt-1 px-2 py-1 rounded bg-blue-600 text-white text-[11px]"
                        onClick={() =>
                          setSelectedRouteArmadorId((current) =>
                            current === popupInfo.data.id ? null : popupInfo.data.id,
                          )
                        }
                      >
                        {selectedRouteArmadorId === popupInfo.data.id
                          ? 'Ocultar ruta'
                          : 'Ver ruta'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-2 min-w-[250px]">
                <h3 className="font-semibold mb-1">📦 {popupInfo.data.codigoReferenciaRetail}</h3>
                <div className="space-y-1 text-sm">
                  <p><strong>Estado:</strong> <Badge>{popupInfo.data.estado}</Badge></p>
                  <p><strong>Proyecto:</strong> {popupInfo.data.proyectoNombre}</p>
                  <p><strong>Armador:</strong> {popupInfo.data.armadorNombre}</p>
                  <p><strong>Dirección:</strong> {popupInfo.data.direccion}</p>
                  <p><strong>Municipio:</strong> {popupInfo.data.municipio}</p>
                </div>
              </div>
            )}
          </Popup>
        )}
      </Map>
    </div>
  );
}
