"use client";

import { useEffect, useRef, useState } from "react";
import Map, { Marker, Source, Layer, NavigationControl } from "react-map-gl";
import type { LayerProps } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Loader2 } from "lucide-react";

interface RutaPunto {
  id: string;
  latitud: number;
  longitud: number;
  timestamp: string;
  tipo: "INICIO" | "INTERMEDIO" | "PARADA" | "FIN";
  descripcion?: string;
}

interface MapaRutaArmadorProps {
  puntos: RutaPunto[];
  className?: string;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

// Estilo de la línea de ruta (azul con bordes como Google Maps)
const routeLayerStyle: LayerProps = {
  id: "route",
  type: "line",
  paint: {
    "line-color": "#4285F4",
    "line-width": 4,
    "line-opacity": 0.8,
  },
  layout: {
    "line-join": "round",
    "line-cap": "round",
  },
};

// Marcador personalizado
function CustomMarker({
  tipo,
  descripcion,
  latitud,
  longitud,
}: {
  tipo: string;
  descripcion?: string;
  latitud: number;
  longitud: number;
}) {
  const getMarkerConfig = () => {
    switch (tipo) {
      case "INICIO":
        return { label: "SP", color: "#10B981", title: "Inicio de turno" };
      case "FIN":
        return { label: "AV", color: "#EF4444", title: "Fin de turno" };
      case "PARADA":
        return { label: "PM", color: "#F59E0B", title: "Parada" };
      default:
        return { label: "•", color: "#6B7280", title: "Punto intermedio" };
    }
  };

  const config = getMarkerConfig();

  return (
    <Marker latitude={latitud} longitude={longitud} anchor="bottom">
      <div className="flex flex-col items-center" title={descripcion || config.title}>
        <div
          className="flex items-center justify-center rounded-full shadow-lg border-2 border-white font-bold text-white text-xs"
          style={{
            backgroundColor: config.color,
            width: tipo === "INTERMEDIO" ? "12px" : "32px",
            height: tipo === "INTERMEDIO" ? "12px" : "32px",
          }}
        >
          {tipo !== "INTERMEDIO" && config.label}
        </div>
        {tipo !== "INTERMEDIO" && (
          <div
            className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent"
            style={{ borderTopColor: config.color }}
          />
        )}
      </div>
    </Marker>
  );
}

export function MapaRutaArmador({ puntos, className = "" }: MapaRutaArmadorProps) {
  const mapRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewState, setViewState] = useState({
    longitude: -89.2182,
    latitude: 13.6929,
    zoom: 12,
  });

  // Crear GeoJSON de la ruta
  const routeGeoJSON = {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "LineString" as const,
      coordinates: puntos.map((p) => [p.longitud, p.latitud]),
    },
  };

  // Ajustar vista para mostrar toda la ruta
  useEffect(() => {
    if (puntos.length === 0) {
      setLoading(false);
      return;
    }

    // Calcular bounds
    const lats = puntos.map((p) => p.latitud);
    const lngs = puntos.map((p) => p.longitud);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    setViewState({
      latitude: centerLat,
      longitude: centerLng,
      zoom: 13,
    });

    setLoading(false);

    // Ajustar bounds después de que el mapa cargue
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      map.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat],
        ],
        {
          padding: 50,
          duration: 1000,
        }
      );
    }
  }, [puntos]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}>
        <p className="text-red-500">Error: Token de Mapbox no configurado</p>
      </div>
    );
  }

  if (puntos.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}>
        <p className="text-gray-500">No hay puntos de ruta para mostrar</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 rounded-lg">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: "100%", height: "100%", borderRadius: "0.5rem" }}
      >
        <NavigationControl position="top-right" />

        {/* Línea de ruta */}
        {puntos.length > 1 && (
          <Source id="route-source" type="geojson" data={routeGeoJSON}>
            <Layer {...routeLayerStyle} />
          </Source>
        )}

        {/* Marcadores */}
        {puntos.map((punto) => (
          <CustomMarker
            key={punto.id}
            tipo={punto.tipo}
            descripcion={punto.descripcion}
            latitud={punto.latitud}
            longitud={punto.longitud}
          />
        ))}
      </Map>
    </div>
  );
}
