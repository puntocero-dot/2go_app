'use client';

import { useState, useEffect } from 'react';
import Map from 'react-map-gl';
import Marker from 'react-map-gl/dist/esm/components/marker';
import { Source, Layer } from 'react-map-gl';
import NavigationControl from 'react-map-gl/dist/esm/components/navigation-control';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Clock, Route, ExternalLink } from 'lucide-react';

type RutaSugerida = {
  distancia: string;
  distanciaMetros: number;
  duracion: string;
  duracionSegundos: number;
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
};

type Props = {
  ordenId: string;
  destino: {
    lat: number;
    lng: number;
    direccion?: string;
  };
  origen?: {
    lat: number;
    lng: number;
  } | null;
};

export function RutaSugeridaCard({ ordenId, destino, origen }: Props) {
  const [rutaSugerida, setRutaSugerida] = useState<RutaSugerida | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ubicacionActual, setUbicacionActual] = useState<{ lat: number; lng: number } | null>(origen || null);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // Obtener ubicación actual del armador
  useEffect(() => {
    if (!origen && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUbicacionActual({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (err) => {
          console.error('Error obteniendo ubicación:', err);
        }
      );
    }
  }, [origen]);

  // Obtener ruta sugerida
  useEffect(() => {
    const fetchRuta = async () => {
      if (!ubicacionActual) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/ordenes/${ordenId}/ruta-sugerida?` + new URLSearchParams({
          origenLat: ubicacionActual.lat.toString(),
          origenLng: ubicacionActual.lng.toString(),
          destinoLat: destino.lat.toString(),
          destinoLng: destino.lng.toString(),
        }));

        if (!response.ok) {
          throw new Error('Error al obtener ruta');
        }

        const data = await response.json();
        setRutaSugerida(data.rutaSugerida);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchRuta();
  }, [ordenId, ubicacionActual, destino]);

  // Abrir en Google Maps o Waze
  const abrirEnMaps = (app: 'google' | 'waze') => {
    const destinoStr = `${destino.lat},${destino.lng}`;
    
    if (app === 'google') {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${destinoStr}&travelmode=driving`, '_blank');
    } else {
      window.open(`https://waze.com/ul?ll=${destinoStr}&navigate=yes`, '_blank');
    }
  };

  if (loading) {
    return (
      <Card className="border-2 border-cyan-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Route className="w-5 h-5 text-cyan-600" />
            Ruta Sugerida
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!ubicacionActual) {
    return (
      <Card className="border-2 border-amber-200 bg-amber-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-amber-800">
            <MapPin className="w-5 h-5" />
            Ubicación requerida
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-amber-700 mb-4">
            Activa la ubicación GPS para ver la ruta sugerida hacia el cliente.
          </p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => abrirEnMaps('google')}
              className="flex-1"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Google Maps
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => abrirEnMaps('waze')}
              className="flex-1"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Waze
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !mapboxToken) {
    return (
      <Card className="border-2 border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Route className="w-5 h-5" />
            Ruta al Cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {error || 'No se pudo cargar el mapa. Usa la navegación externa.'}
          </p>
          <div className="flex gap-2">
            <Button 
              variant="default" 
              size="sm"
              onClick={() => abrirEnMaps('google')}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Google Maps
            </Button>
            <Button 
              variant="default" 
              size="sm"
              onClick={() => abrirEnMaps('waze')}
              className="flex-1 bg-cyan-600 hover:bg-cyan-700"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Waze
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calcular centro del mapa
  const centerLat = (ubicacionActual.lat + destino.lat) / 2;
  const centerLng = (ubicacionActual.lng + destino.lng) / 2;

  // GeoJSON de la ruta sugerida
  const rutaLineString = rutaSugerida ? {
    type: 'Feature' as const,
    properties: {},
    geometry: rutaSugerida.geometry,
  } : null;

  return (
    <Card className="border-2 border-cyan-200 bg-gradient-to-br from-cyan-50 to-blue-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Route className="w-5 h-5 text-cyan-600" />
            Ruta Sugerida
          </CardTitle>
          {rutaSugerida && (
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1 text-cyan-700">
                <Navigation className="w-4 h-4" />
                <span className="font-semibold">{rutaSugerida.distancia}</span>
              </div>
              <div className="flex items-center gap-1 text-cyan-700">
                <Clock className="w-4 h-4" />
                <span className="font-semibold">{rutaSugerida.duracion}</span>
              </div>
            </div>
          )}
        </div>
        {destino.direccion && (
          <p className="text-sm text-muted-foreground mt-1">
            📍 {destino.direccion}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mapa */}
        <div className="relative h-56 w-full rounded-xl overflow-hidden border-2 border-white shadow-lg">
          <Map
            initialViewState={{
              longitude: centerLng,
              latitude: centerLat,
              zoom: 12,
            }}
            mapStyle="mapbox://styles/mapbox/streets-v12"
            mapboxAccessToken={mapboxToken}
          >
            <NavigationControl position="top-right" />

            {/* Línea de la ruta sugerida */}
            {rutaLineString && (
              <Source id="ruta-sugerida" type="geojson" data={rutaLineString}>
                <Layer
                  id="ruta-sugerida-line"
                  type="line"
                  paint={{
                    'line-color': '#0891b2',
                    'line-width': 5,
                    'line-opacity': 0.8,
                  }}
                  layout={{
                    'line-join': 'round',
                    'line-cap': 'round',
                  }}
                />
              </Source>
            )}

            {/* Marcador de ubicación actual (armador) */}
            <Marker longitude={ubicacionActual.lng} latitude={ubicacionActual.lat}>
              <div className="relative">
                <div className="w-10 h-10 bg-blue-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center animate-pulse">
                  <span className="text-white text-sm font-bold">Tú</span>
                </div>
              </div>
            </Marker>

            {/* Marcador de destino (cliente) */}
            <Marker longitude={destino.lng} latitude={destino.lat}>
              <div className="relative">
                <div className="w-10 h-10 bg-red-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
              </div>
            </Marker>
          </Map>
        </div>

        {/* Botones de navegación */}
        <div className="flex gap-2">
          <Button 
            variant="default" 
            size="sm"
            onClick={() => abrirEnMaps('google')}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <Navigation className="w-4 h-4 mr-2" />
            Navegar con Google Maps
          </Button>
          <Button 
            variant="default" 
            size="sm"
            onClick={() => abrirEnMaps('waze')}
            className="flex-1 bg-cyan-600 hover:bg-cyan-700"
          >
            <Navigation className="w-4 h-4 mr-2" />
            Navegar con Waze
          </Button>
        </div>

        {/* Leyenda */}
        <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full" />
            <span>Tu ubicación</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <span>Cliente</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-6 h-1 bg-cyan-600 rounded" />
            <span>Ruta sugerida</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
