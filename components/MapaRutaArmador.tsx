"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Map, { Marker, Source, Layer, NavigationControl, Popup } from "react-map-gl";
import type { LayerProps } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Loader2, Play, Pause, SkipBack, Clock, MapPin, Navigation } from "lucide-react";
import { EnhancedButton } from "@/components/ui/enhanced-button";

interface RutaPunto {
  id: string;
  latitud: number;
  longitud: number;
  timestamp: string;
  tipo: "INICIO" | "INTERMEDIO" | "PARADA" | "FIN";
  descripcion?: string;
  ordenId?: string;
  ordenCodigo?: string;
}

interface MapaRutaArmadorProps {
  puntos: RutaPunto[];
  className?: string;
  showAnimation?: boolean;
  showDirections?: boolean;
}

const MAPBOX_TOKEN =
  process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ||
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
  "";

// Estilo de la línea de ruta recorrida (azul sólido)
const routeLayerStyle: LayerProps = {
  id: "route",
  type: "line",
  paint: {
    "line-color": "#4285F4",
    "line-width": 5,
    "line-opacity": 1,
  },
  layout: {
    "line-join": "round",
    "line-cap": "round",
  },
};

// Estilo del borde de la ruta (para efecto 3D como Google Maps)
const routeBorderLayerStyle: LayerProps = {
  id: "route-border",
  type: "line",
  paint: {
    "line-color": "#1a73e8",
    "line-width": 8,
    "line-opacity": 0.4,
  },
  layout: {
    "line-join": "round",
    "line-cap": "round",
  },
};

// Estilo para la ruta animada (punto en movimiento)
const animatedPointLayerStyle: LayerProps = {
  id: "animated-point",
  type: "circle",
  paint: {
    "circle-radius": 8,
    "circle-color": "#4285F4",
    "circle-stroke-width": 3,
    "circle-stroke-color": "#ffffff",
  },
};

// Estilo para ruta con direcciones reales (de Mapbox Directions API)
const directionsRouteStyle: LayerProps = {
  id: "directions-route",
  type: "line",
  paint: {
    "line-color": "#4285F4",
    "line-width": 6,
    "line-opacity": 0.9,
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

export function MapaRutaArmador({ 
  puntos, 
  className = "",
  showAnimation = true,
  showDirections = false 
}: MapaRutaArmadorProps) {
  const mapRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [selectedPunto, setSelectedPunto] = useState<RutaPunto | null>(null);
  const [directionsRoute, setDirectionsRoute] = useState<any>(null);
  const animationRef = useRef<number | null>(null);
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

  // Calcular punto animado basado en progreso
  const getAnimatedPoint = useCallback(() => {
    if (puntos.length < 2) return null;
    
    const totalSegments = puntos.length - 1;
    const currentSegment = Math.floor(animationProgress * totalSegments);
    const segmentProgress = (animationProgress * totalSegments) % 1;
    
    if (currentSegment >= totalSegments) {
      return puntos[puntos.length - 1];
    }
    
    const start = puntos[currentSegment];
    const end = puntos[currentSegment + 1];
    
    return {
      latitud: start.latitud + (end.latitud - start.latitud) * segmentProgress,
      longitud: start.longitud + (end.longitud - start.longitud) * segmentProgress,
    };
  }, [puntos, animationProgress]);

  // Animación de reproducción
  useEffect(() => {
    if (isPlaying && puntos.length > 1) {
      const animate = () => {
        setAnimationProgress((prev) => {
          if (prev >= 1) {
            setIsPlaying(false);
            return 1;
          }
          return prev + 0.002; // Velocidad de animación
        });
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, puntos.length]);

  // Obtener ruta real de Mapbox Directions API
  useEffect(() => {
    if (!showDirections || puntos.length < 2 || !MAPBOX_TOKEN) return;
    
    const fetchDirections = async () => {
      // Limitar a 25 puntos para la API (máximo permitido)
      const waypoints = puntos.length > 25 
        ? puntos.filter((_, i) => i % Math.ceil(puntos.length / 25) === 0 || i === puntos.length - 1)
        : puntos;
      
      const coordinates = waypoints
        .map((p) => `${p.longitud},${p.latitud}`)
        .join(";");
      
      try {
        const response = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`
        );
        const data = await response.json();
        
        if (data.routes && data.routes[0]) {
          setDirectionsRoute({
            type: "Feature",
            properties: {},
            geometry: data.routes[0].geometry,
          });
        }
      } catch (error) {
        console.error("Error fetching directions:", error);
      }
    };
    
    fetchDirections();
  }, [puntos, showDirections]);

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
    setTimeout(() => {
      if (mapRef.current) {
        const map = mapRef.current.getMap();
        map.fitBounds(
          [
            [minLng - 0.01, minLat - 0.01],
            [maxLng + 0.01, maxLat + 0.01],
          ],
          {
            padding: 60,
            duration: 1000,
          }
        );
      }
    }, 100);
  }, [puntos]);

  const animatedPoint = getAnimatedPoint();

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

  // Calcular tiempo entre puntos
  const getTimeBetweenPoints = (index: number) => {
    if (index === 0 || index >= puntos.length) return null;
    const prev = new Date(puntos[index - 1].timestamp);
    const curr = new Date(puntos[index].timestamp);
    const diffMs = curr.getTime() - prev.getTime();
    const diffMins = Math.round(diffMs / 60000);
    return diffMins;
  };

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 rounded-lg">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Controles de animación */}
      {showAnimation && puntos.length > 1 && (
        <div className="absolute top-4 left-4 z-20 bg-white rounded-lg shadow-lg p-2 flex items-center gap-2">
          <EnhancedButton
            size="sm"
            variant="outline"
            onClick={() => {
              setAnimationProgress(0);
              setIsPlaying(false);
            }}
            title="Reiniciar"
          >
            <SkipBack className="w-4 h-4" />
          </EnhancedButton>
          <EnhancedButton
            size="sm"
            variant={isPlaying ? "secondary" : "default"}
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? "Pausar" : "Reproducir"}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </EnhancedButton>
          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-100"
              style={{ width: `${animationProgress * 100}%` }}
            />
          </div>
          <span className="text-xs text-gray-600 min-w-[40px]">
            {Math.round(animationProgress * 100)}%
          </span>
        </div>
      )}

      {/* Leyenda */}
      <div className="absolute bottom-4 left-4 z-20 bg-white rounded-lg shadow-lg p-3">
        <div className="text-xs font-semibold mb-2">Leyenda</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span className="text-xs">Inicio</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-orange-500"></div>
            <span className="text-xs">Parada/Entrega</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span className="text-xs">Fin</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-blue-500 rounded"></div>
            <span className="text-xs">Recorrido</span>
          </div>
        </div>
      </div>

      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: "100%", height: "100%", borderRadius: "0.5rem" }}
      >
        <NavigationControl position="top-right" />

        {/* Borde de ruta (efecto sombra) */}
        {puntos.length > 1 && (
          <Source id="route-border-source" type="geojson" data={directionsRoute || routeGeoJSON}>
            <Layer {...routeBorderLayerStyle} />
          </Source>
        )}

        {/* Línea de ruta principal */}
        {puntos.length > 1 && (
          <Source id="route-source" type="geojson" data={directionsRoute || routeGeoJSON}>
            <Layer {...routeLayerStyle} />
          </Source>
        )}

        {/* Punto animado */}
        {showAnimation && animatedPoint && isPlaying && (
          <Marker
            latitude={animatedPoint.latitud}
            longitude={animatedPoint.longitud}
            anchor="center"
          >
            <div className="relative">
              <div className="w-6 h-6 bg-blue-500 rounded-full border-3 border-white shadow-lg animate-pulse" />
              <div className="absolute -inset-2 bg-blue-500/30 rounded-full animate-ping" />
            </div>
          </Marker>
        )}

        {/* Marcadores con popup */}
        {puntos.map((punto, index) => (
          <Marker
            key={punto.id}
            latitude={punto.latitud}
            longitude={punto.longitud}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedPunto(punto);
            }}
          >
            <div className="flex flex-col items-center cursor-pointer hover:scale-110 transition-transform">
              <div
                className="flex items-center justify-center rounded-full shadow-lg border-2 border-white font-bold text-white text-xs"
                style={{
                  backgroundColor:
                    punto.tipo === "INICIO"
                      ? "#10B981"
                      : punto.tipo === "FIN"
                      ? "#EF4444"
                      : punto.tipo === "PARADA"
                      ? "#F59E0B"
                      : "#6B7280",
                  width: punto.tipo === "INTERMEDIO" ? "14px" : "36px",
                  height: punto.tipo === "INTERMEDIO" ? "14px" : "36px",
                }}
              >
                {punto.tipo !== "INTERMEDIO" && (
                  punto.tipo === "INICIO" ? "A" : punto.tipo === "FIN" ? "B" : index
                )}
              </div>
              {punto.tipo !== "INTERMEDIO" && (
                <div
                  className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-transparent"
                  style={{
                    borderTopColor:
                      punto.tipo === "INICIO"
                        ? "#10B981"
                        : punto.tipo === "FIN"
                        ? "#EF4444"
                        : "#F59E0B",
                  }}
                />
              )}
            </div>
          </Marker>
        ))}

        {/* Popup de información */}
        {selectedPunto && (
          <Popup
            latitude={selectedPunto.latitud}
            longitude={selectedPunto.longitud}
            onClose={() => setSelectedPunto(null)}
            closeButton={true}
            closeOnClick={false}
            anchor="bottom"
            offset={[0, -40]}
          >
            <div className="p-2 min-w-[180px]">
              <div className="font-semibold text-sm mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {selectedPunto.tipo === "INICIO"
                  ? "Inicio del turno"
                  : selectedPunto.tipo === "FIN"
                  ? "Fin del turno"
                  : selectedPunto.tipo === "PARADA"
                  ? "Parada/Entrega"
                  : "Punto de ruta"}
              </div>
              {selectedPunto.descripcion && (
                <p className="text-xs text-gray-600 mb-2">{selectedPunto.descripcion}</p>
              )}
              {selectedPunto.ordenCodigo && (
                <p className="text-xs text-blue-600 mb-2">Orden: #{selectedPunto.ordenCodigo}</p>
              )}
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                {new Date(selectedPunto.timestamp).toLocaleString("es-ES", {
                  hour: "2-digit",
                  minute: "2-digit",
                  day: "2-digit",
                  month: "short",
                })}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                <Navigation className="w-3 h-3" />
                {selectedPunto.latitud.toFixed(5)}, {selectedPunto.longitud.toFixed(5)}
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
