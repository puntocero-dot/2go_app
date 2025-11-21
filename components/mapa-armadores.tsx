"use client";

import { Fragment, useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { ExternalLink } from "lucide-react";
import { Badge } from "./ui/badge";

// Fix para los iconos de Leaflet en Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface Armador {
  id: string;
  nombre: string;
  telefono: string;
  estado: string;
  lat: number;
  lng: number;
  ultimaActualizacion: string;
  ordenesActivas: number;
  ordenes: any[];
  ruta?: { lat: number; lng: number; timestamp: string }[];
}

const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

// Marcador personalizado para armadores
const armadorIcon = L.divIcon({
  className: "custom-marker-armador",
  html: `
    <div class="relative">
      <div class="absolute -top-10 -left-4 w-10 h-10 bg-vibrant-cyan rounded-full border-2 border-white shadow-lg flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
      <div class="absolute -top-12 -left-8 w-1 h-3 bg-vibrant-cyan"></div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

export function MapaArmadores() {
  const [armadores, setArmadores] = useState<Armador[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArmadores();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchArmadores, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchArmadores = async () => {
    try {
      const response = await fetch("/api/armadores/mapa");
      const data = await response.json();
      
      if (response.ok) {
        setArmadores(data.armadores || []);
      }
    } catch (error) {
      console.error("Error cargando armadores:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-[600px] bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Cargando mapa...</p>
      </div>
    );
  }

  if (armadores.length === 0) {
    return (
      <div className="w-full h-[600px] bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">No hay armadores con ubicación disponible</p>
      </div>
    );
  }

  // Centro del mapa (promedio de todas las ubicaciones o una ubicación por defecto)
  const centerLat = armadores.length > 0
    ? armadores.reduce((sum, a) => sum + a.lat, 0) / armadores.length
    : 14.6349; // Guatemala City por defecto
  
  const centerLng = armadores.length > 0
    ? armadores.reduce((sum, a) => sum + a.lng, 0) / armadores.length
    : -90.5069;

  const hasMapbox = !!MAPBOX_ACCESS_TOKEN;

  return (
    <div className="w-full h-[600px] rounded-lg overflow-hidden border border-gray-200">
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution={
            hasMapbox
              ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://www.mapbox.com/">Mapbox</a>'
              : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }
          url={
            hasMapbox
              ? `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${MAPBOX_ACCESS_TOKEN}`
              : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          }
          tileSize={hasMapbox ? 512 : 256}
          zoomOffset={hasMapbox ? -1 : 0}
        />
        
        {armadores.map((armador) => {
          const rutaCoords = (armador.ruta || []).map((p) => [p.lat, p.lng]) as [
            number,
            number
          ][];

          return (
            <Fragment key={armador.id}>
              {rutaCoords.length > 1 && (
                <Polyline
                  positions={rutaCoords}
                  pathOptions={{ color: "#8B6F47", weight: 3, opacity: 0.7 }}
                />
              )}

              <Marker
                position={[armador.lat, armador.lng]}
                icon={armadorIcon}
              >
                <Popup>
                  <div className="p-3 min-w-[220px]">
                    <h3 className="font-semibold text-deep-navy text-base mb-2">
                      {armador.nombre}
                    </h3>

                    <div className="space-y-1 text-sm mb-3">
                      <p className="text-gray-700">
                        <span className="font-medium">Estado:</span>{" "}
                        <Badge variant={armador.estado === "DISPONIBLE" ? "success" : "warning"}>
                          {armador.estado}
                        </Badge>
                      </p>
                      <p className="text-gray-700">
                        <span className="font-medium">Teléfono:</span> {armador.telefono}
                      </p>
                      <p className="text-gray-700">
                        <span className="font-medium">Órdenes activas:</span>{" "}
                        {armador.ordenesActivas}
                      </p>
                      <p className="text-xs text-gray-500">
                        Última actualización: {" "}
                        {new Date(armador.ultimaActualizacion).toLocaleTimeString()}
                      </p>
                    </div>

                    {armador.ordenes.length > 0 ? (
                      <div className="border-t pt-2 mt-1">
                        <p className="font-medium text-xs mb-1">Órdenes:</p>
                        {armador.ordenes.map((orden) => (
                          <div key={orden.id} className="text-xs mb-1 bg-gray-50 p-1.5 rounded">
                            <p className="font-medium">{orden.codigo}</p>
                            <p className="text-gray-600">{orden.cliente}</p>
                            <p className="text-gray-500">{orden.municipio}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">Sin orden activa</p>
                    )}

                    {armador.ruta && armador.ruta.length > 1 && (
                      <p className="mt-2 text-[11px] text-gray-500">
                        Puntos de ruta en las últimas 24h: {armador.ruta.length}
                      </p>
                    )}
                    <div className="mt-3">
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${armador.lat},${armador.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-vibrant-cyan hover:underline font-medium"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Abrir en Google Maps
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            </Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
}