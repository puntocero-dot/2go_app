'use client';

import { useState, useEffect } from 'react';
import Map from 'react-map-gl';
import Marker from 'react-map-gl/dist/esm/components/marker';
import { Source, Layer } from 'react-map-gl';
import NavigationControl from 'react-map-gl/dist/esm/components/navigation-control';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Navigation, Clock } from 'lucide-react';

type RutaPunto = {
  lat: number;
  lng: number;
  timestamp: string;
  tipo: string;
};

type Props = {
  ordenId: string;
};

export function OrdenRutaMapa({ ordenId }: Props) {
  const [ruta, setRuta] = useState<RutaPunto[]>([]);
  const [destino, setDestino] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  useEffect(() => {
    const fetchRuta = async () => {
      try {
        const response = await fetch(`/api/ordenes/${ordenId}/ruta`);
        if (!response.ok) throw new Error('Error al cargar la ruta');
        
        const data = await response.json();
        setRuta(data.ruta || []);
        setDestino(data.destino);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchRuta();
  }, [ordenId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="w-5 h-5" />
            Ruta del Armador
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !mapboxToken) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="w-5 h-5" />
            Ruta del Armador
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center bg-muted rounded-lg">
            <p className="text-muted-foreground">
              {error || 'Mapa no configurado'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (ruta.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="w-5 h-5" />
            Ruta del Armador
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center bg-muted rounded-lg">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">
                No hay datos de ruta disponibles
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                La ruta se registrará cuando el armador inicie su turno
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calcular centro del mapa basado en la ruta
  const center = ruta.length > 0
    ? {
        longitude: ruta[ruta.length - 1].lng,
        latitude: ruta[ruta.length - 1].lat,
      }
    : { longitude: -89.2182, latitude: 13.6929 };

  // Crear línea de la ruta para GeoJSON
  const rutaLineString = {
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'LineString' as const,
      coordinates: ruta.map(p => [p.lng, p.lat]),
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="w-5 h-5" />
          Ruta del Armador
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {ruta.length} puntos registrados
          </div>
          {ruta.length > 0 && (
            <div>
              Último registro: {new Date(ruta[ruta.length - 1].timestamp).toLocaleString('es-SV')}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative h-[400px] w-full rounded-lg overflow-hidden">
          <Map
            initialViewState={{
              ...center,
              zoom: 13,
            }}
            mapStyle="mapbox://styles/mapbox/streets-v12"
            mapboxAccessToken={mapboxToken}
          >
            <NavigationControl position="top-right" />

            {/* Línea de la ruta */}
            <Source id="ruta" type="geojson" data={rutaLineString}>
              <Layer
                id="ruta-line"
                type="line"
                paint={{
                  'line-color': '#3b82f6',
                  'line-width': 4,
                  'line-opacity': 0.8,
                }}
              />
            </Source>

            {/* Marcador de inicio */}
            {ruta.length > 0 && (
              <Marker longitude={ruta[0].lng} latitude={ruta[0].lat}>
                <div className="relative">
                  <div className="w-8 h-8 bg-green-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                    <span className="text-white text-xs font-bold">I</span>
                  </div>
                </div>
              </Marker>
            )}

            {/* Marcador de posición actual */}
            {ruta.length > 0 && (
              <Marker longitude={ruta[ruta.length - 1].lng} latitude={ruta[ruta.length - 1].lat}>
                <div className="relative">
                  <div className="w-8 h-8 bg-blue-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center animate-pulse">
                    <span className="text-white text-xs font-bold">A</span>
                  </div>
                </div>
              </Marker>
            )}

            {/* Marcador de destino */}
            {destino && (
              <Marker longitude={destino.lng} latitude={destino.lat}>
                <div className="relative">
                  <div className="w-8 h-8 bg-red-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                </div>
              </Marker>
            )}
          </Map>
        </div>

        {/* Leyenda */}
        <div className="flex flex-wrap gap-4 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
            <span>Inicio</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white" />
            <span>Posición Actual</span>
          </div>
          {destino && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
              <span>Destino</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-12 h-1 bg-blue-500" />
            <span>Ruta recorrida</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
