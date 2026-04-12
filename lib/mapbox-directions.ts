/**
 * Servicio para obtener rutas por carretera usando Mapbox Directions API
 * Permite comparar la ruta sugerida vs la ruta GPS real del armador
 */

export interface RouteGeometry {
  type: 'LineString';
  coordinates: [number, number][];
}

export interface DirectionsRoute {
  geometry: RouteGeometry;
  distance: number; // metros
  duration: number; // segundos
  durationInTraffic?: number; // segundos con tráfico (si disponible)
}

export interface DirectionsResult {
  route: DirectionsRoute | null;
  error?: string;
}

/**
 * Obtiene la ruta por carretera entre dos puntos usando Mapbox Directions API
 * @param origin Coordenadas de origen { lat, lng }
 * @param destination Coordenadas de destino { lat, lng }
 * @param profile Perfil de ruta: 'driving', 'driving-traffic', 'walking', 'cycling'
 */
export async function getRouteDirections(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  profile: 'driving' | 'driving-traffic' | 'walking' | 'cycling' = 'driving-traffic'
): Promise<DirectionsResult> {
  const token = process.env.MAPBOX_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  
  if (!token) {
    return { route: null, error: 'Token de Mapbox no configurado' };
  }

  try {
    // Formato: lng,lat;lng,lat
    const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
    const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coords}?geometries=geojson&overview=full&annotations=duration,distance&access_token=${token}`;

    const response = await fetch(url);

    if (response.status === 401 || response.status === 403) {
      return { route: null, error: 'Token de Mapbox inválido o sin permisos' };
    }

    if (!response.ok) {
      return { route: null, error: `Error de Mapbox: ${response.status}` };
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      return { route: null, error: 'No se encontró ruta entre los puntos' };
    }

    const route = data.routes[0];

    return {
      route: {
        geometry: route.geometry,
        distance: route.distance,
        duration: route.duration,
        durationInTraffic: route.duration_typical || route.duration,
      },
    };
  } catch (error) {
    console.error('Error obteniendo ruta de Mapbox:', error);
    return { route: null, error: 'Error de conexión con Mapbox' };
  }
}

/**
 * Obtiene múltiples rutas alternativas entre dos puntos
 */
export async function getAlternativeRoutes(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<{ routes: DirectionsRoute[]; error?: string }> {
  const token = process.env.MAPBOX_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  
  if (!token) {
    return { routes: [], error: 'Token de Mapbox no configurado' };
  }

  try {
    const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${coords}?geometries=geojson&overview=full&alternatives=true&access_token=${token}`;

    const response = await fetch(url);

    if (!response.ok) {
      return { routes: [], error: `Error de Mapbox: ${response.status}` };
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      return { routes: [], error: 'No se encontraron rutas' };
    }

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      routes: data.routes.map((route: any) => ({
        geometry: route.geometry,
        distance: route.distance,
        duration: route.duration,
        durationInTraffic: route.duration_typical || route.duration,
      })),
    };
  } catch (error) {
    console.error('Error obteniendo rutas alternativas:', error);
    return { routes: [], error: 'Error de conexión con Mapbox' };
  }
}

/**
 * Calcula la desviación entre la ruta GPS real y la ruta sugerida
 * Retorna métricas de comparación
 */
export function calculateRouteDeviation(
  gpsPoints: { lat: number; lng: number }[],
  suggestedRoute: RouteGeometry
): {
  totalGpsDistance: number; // km recorridos según GPS
  suggestedDistance: number; // km de ruta sugerida
  deviationPercent: number; // % de desviación
  extraKm: number; // km extra recorridos
} {
  if (gpsPoints.length < 2) {
    return {
      totalGpsDistance: 0,
      suggestedDistance: 0,
      deviationPercent: 0,
      extraKm: 0,
    };
  }

  // Calcular distancia total GPS usando Haversine
  let totalGpsDistance = 0;
  for (let i = 1; i < gpsPoints.length; i++) {
    totalGpsDistance += haversineDistance(
      gpsPoints[i - 1].lat,
      gpsPoints[i - 1].lng,
      gpsPoints[i].lat,
      gpsPoints[i].lng
    );
  }

  // Calcular distancia de ruta sugerida
  let suggestedDistance = 0;
  const coords = suggestedRoute.coordinates;
  for (let i = 1; i < coords.length; i++) {
    suggestedDistance += haversineDistance(
      coords[i - 1][1], // lat
      coords[i - 1][0], // lng
      coords[i][1],
      coords[i][0]
    );
  }

  const extraKm = Math.max(0, totalGpsDistance - suggestedDistance);
  const deviationPercent = suggestedDistance > 0 
    ? ((totalGpsDistance - suggestedDistance) / suggestedDistance) * 100 
    : 0;

  return {
    totalGpsDistance: Math.round(totalGpsDistance * 100) / 100,
    suggestedDistance: Math.round(suggestedDistance * 100) / 100,
    deviationPercent: Math.round(deviationPercent * 10) / 10,
    extraKm: Math.round(extraKm * 100) / 100,
  };
}

/**
 * Fórmula de Haversine para calcular distancia entre dos puntos GPS
 * @returns Distancia en kilómetros
 */
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Formatea duración en minutos a texto legible
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes} min`;
}

/**
 * Formatea distancia en metros a texto legible
 */
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}
