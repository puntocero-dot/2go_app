// Obtener posición actual del navegador
export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocalización no soportada por el navegador"));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
  });
}

// Calcular distancia entre dos puntos (Haversine)
export function calcularDistancia(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distancia = R * c;

  return distancia; // en kilómetros
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Validar coordenadas
export function validarCoordenadas(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

// Formatear coordenadas para display
export function formatearCoordenadas(lat: number, lng: number): string {
  const latDir = lat >= 0 ? "N" : "S";
  const lngDir = lng >= 0 ? "E" : "W";

  return `${Math.abs(lat).toFixed(6)}°${latDir}, ${Math.abs(lng).toFixed(6)}°${lngDir}`;
}

// Obtener ubicación con manejo de errores
export async function obtenerUbicacion(): Promise<{
  latitud: number;
  longitud: number;
  precision: number;
}> {
  try {
    const position = await getCurrentPosition();

    return {
      latitud: position.coords.latitude,
      longitud: position.coords.longitude,
      precision: position.coords.accuracy,
    };
  } catch (error) {
    if (error instanceof GeolocationPositionError) {
      switch (error.code) {
        case error.PERMISSION_DENIED:
          throw new Error("Permiso de ubicación denegado");
        case error.POSITION_UNAVAILABLE:
          throw new Error("Ubicación no disponible");
        case error.TIMEOUT:
          throw new Error("Tiempo de espera agotado");
        default:
          throw new Error("Error desconocido al obtener ubicación");
      }
    }
    throw error;
  }
}

// Calcular distancia total de una ruta
export function calcularDistanciaTotal(
  puntos: Array<{ latitud: number; longitud: number }>
): number {
  if (puntos.length < 2) return 0;

  let distanciaTotal = 0;

  for (let i = 0; i < puntos.length - 1; i++) {
    const p1 = puntos[i];
    const p2 = puntos[i + 1];
    distanciaTotal += calcularDistancia(p1.latitud, p1.longitud, p2.latitud, p2.longitud);
  }

  return distanciaTotal;
}

// Formatear distancia
export function formatearDistancia(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(2)} km`;
}

// Calcular duración entre dos timestamps
export function calcularDuracion(inicio: string, fin: string): string {
  const diff = new Date(fin).getTime() - new Date(inicio).getTime();
  const horas = Math.floor(diff / (1000 * 60 * 60));
  const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (horas > 0) {
    return `${horas}h ${minutos}m`;
  }
  return `${minutos}m`;
}
