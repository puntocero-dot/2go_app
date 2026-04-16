"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface TrackingMapProps {
  armadorPosition: { lat: number; lng: number } | null;
  destinationPosition: { lat: number; lng: number } | null;
  ordenId: string;
  token: string;
  className?: string;
}

export function TrackingMap({
  armadorPosition,
  destinationPosition,
  ordenId,
  token,
  className = "",
}: TrackingMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const armadorMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const destinationMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: destinationPosition
        ? [destinationPosition.lng, destinationPosition.lat]
        : armadorPosition
        ? [armadorPosition.lng, armadorPosition.lat]
        : [-89.2182, 13.6929], // San Salvador default
      zoom: 13,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.on("load", () => {
      setMapLoaded(true);

      // Add route source (empty initially)
      map.addSource("route", {
        type: "geojson",
        data: { type: "Feature", geometry: { type: "LineString", coordinates: [] }, properties: {} },
      });

      // Route line layer
      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#3b82f6",
          "line-width": 4,
          "line-opacity": 0.8,
        },
      });

      // Route glow layer (behind)
      map.addLayer({
        id: "route-glow",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#3b82f6",
          "line-width": 10,
          "line-opacity": 0.15,
        },
      }, "route-line");
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch route from API
  const fetchRoute = useCallback(async () => {
    if (!armadorPosition || !destinationPosition || !ordenId || !token) return;

    try {
      const res = await fetch(
        `/api/seguimiento/${ordenId}/ruta?token=${encodeURIComponent(token)}&fromLat=${armadorPosition.lat}&fromLng=${armadorPosition.lng}`
      );
      if (!res.ok) return;
      const data = await res.json();

      if (data.coordinates && mapRef.current?.getSource("route")) {
        (mapRef.current.getSource("route") as mapboxgl.GeoJSONSource).setData({
          type: "Feature",
          geometry: { type: "LineString", coordinates: data.coordinates },
          properties: {},
        });
      }
    } catch {
      // Silent fail - route will update on next position change
    }
  }, [armadorPosition, destinationPosition, ordenId, token]);

  // Update route when armador moves
  useEffect(() => {
    if (mapLoaded) fetchRoute();
  }, [mapLoaded, fetchRoute]);

  // Update armador marker
  useEffect(() => {
    if (!mapRef.current || !armadorPosition || !mapLoaded) return;

    if (!armadorMarkerRef.current) {
      // Create pulsing dot element
      const el = document.createElement("div");
      el.innerHTML = `
        <div style="position: relative; width: 20px; height: 20px;">
          <div style="position: absolute; inset: 0; background: #3b82f6; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 0 8px rgba(59,130,246,0.5);"></div>
          <div style="position: absolute; inset: -6px; background: rgba(59,130,246,0.3); border-radius: 50%; animation: pulse 2s infinite;"></div>
        </div>
        <style>@keyframes pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0; } }</style>
      `;

      armadorMarkerRef.current = new mapboxgl.Marker({ element: el })
        .setLngLat([armadorPosition.lng, armadorPosition.lat])
        .addTo(mapRef.current);
    } else {
      // Smoothly update position
      armadorMarkerRef.current.setLngLat([armadorPosition.lng, armadorPosition.lat]);
    }
  }, [armadorPosition, mapLoaded]);

  // Update destination marker
  useEffect(() => {
    if (!mapRef.current || !destinationPosition || !mapLoaded) return;

    if (!destinationMarkerRef.current) {
      const el = document.createElement("div");
      el.innerHTML = `
        <div style="width: 24px; height: 32px; position: relative;">
          <svg viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20s12-11 12-20c0-6.627-5.373-12-12-12z" fill="#ef4444"/>
            <circle cx="12" cy="12" r="5" fill="white"/>
          </svg>
        </div>
      `;

      destinationMarkerRef.current = new mapboxgl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([destinationPosition.lng, destinationPosition.lat])
        .addTo(mapRef.current);
    }
  }, [destinationPosition, mapLoaded]);

  // Fit bounds to show both markers
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    if (!armadorPosition || !destinationPosition) return;

    const bounds = new mapboxgl.LngLatBounds();
    bounds.extend([armadorPosition.lng, armadorPosition.lat]);
    bounds.extend([destinationPosition.lng, destinationPosition.lat]);

    mapRef.current.fitBounds(bounds, {
      padding: { top: 60, bottom: 60, left: 40, right: 40 },
      maxZoom: 15,
      duration: 1000,
    });
  }, [armadorPosition, destinationPosition, mapLoaded]);

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full" />
      {/* GPS real indicator */}
      {armadorPosition && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          GPS real
        </div>
      )}
    </div>
  );
}
