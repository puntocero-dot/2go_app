import type { GeomapsConfig } from "./geomaps-config";

export type RutaPoint = {
  lat: number;
  lng: number;
  timestamp: string; // ISO
};

export type ClientePoint = {
  lat: number;
  lng: number;
};

export type StopEvent = {
  startTimestamp: string;
  endTimestamp: string;
  durationMin: number;
  lat: number;
  lng: number;
};

export type SpeedEvent = {
  startTimestamp: string;
  endTimestamp: string;
  speedKmh: number;
  from: { lat: number; lng: number };
  to: { lat: number; lng: number };
};

export type RutaAnalysis = {
  totalDistanciaKm: number;
  maxSpeedKmh: number;
  paradasLargas: StopEvent[];
  eventosVelocidad: SpeedEvent[];
  estuvoEnCliente: boolean;
};

function toRad(value: number): number {
  return (value * Math.PI) / 180;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function analizarRuta(
  ruta: RutaPoint[],
  clientes: ClientePoint[],
  config: GeomapsConfig,
): RutaAnalysis {
  if (!ruta || ruta.length < 2) {
    return {
      totalDistanciaKm: 0,
      maxSpeedKmh: 0,
      paradasLargas: [],
      eventosVelocidad: [],
      estuvoEnCliente: false,
    };
  }

  let totalDistanciaKm = 0;
  let maxSpeedKmh = 0;
  const paradasLargas: StopEvent[] = [];
  const eventosVelocidad: SpeedEvent[] = [];

  const stopRadiusKm = config.stopRadiusMeters / 1000;
  const clienteRadiusKm = config.clienteRadiusMeters / 1000;
  const stopMinMs = config.stopDurationMin * 60 * 1000;

  let currentStopStartIndex: number | null = null;

  const puntos = ruta
    .map((p) => ({ ...p, date: new Date(p.timestamp) }))
    .filter((p) => !Number.isNaN(p.date.getTime()))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  // Si después del filtrado no hay suficientes puntos
  if (puntos.length < 2) {
    return {
      totalDistanciaKm: 0,
      maxSpeedKmh: 0,
      paradasLargas: [],
      eventosVelocidad: [],
      estuvoEnCliente: false,
    };
  }

  for (let i = 1; i < puntos.length; i++) {
    const prev = puntos[i - 1];
    const curr = puntos[i];

    const distKm = haversineKm(prev.lat, prev.lng, curr.lat, curr.lng);
    const dtHours = (curr.date.getTime() - prev.date.getTime()) / (1000 * 60 * 60);

    if (dtHours > 0) {
      const speedKmh = distKm / dtHours;
      totalDistanciaKm += distKm;
      if (speedKmh > maxSpeedKmh) {
        maxSpeedKmh = speedKmh;
      }
      if (speedKmh >= config.speedingKmh) {
        eventosVelocidad.push({
          startTimestamp: prev.date.toISOString(),
          endTimestamp: curr.date.toISOString(),
          speedKmh,
          from: { lat: prev.lat, lng: prev.lng },
          to: { lat: curr.lat, lng: curr.lng },
        });
      }
    }

    // Detección de parada larga basada en radio pequeño acumulado
    const distDesdePrev = haversineKm(prev.lat, prev.lng, curr.lat, curr.lng);
    if (distDesdePrev <= stopRadiusKm) {
      if (currentStopStartIndex == null) {
        currentStopStartIndex = i - 1;
      }
      const start = puntos[currentStopStartIndex];
      const duration = curr.date.getTime() - start.date.getTime();
      if (duration >= stopMinMs) {
        const slice = puntos.slice(currentStopStartIndex, i + 1);
        const avgLat = slice.reduce((sum, p) => sum + p.lat, 0) / slice.length;
        const avgLng = slice.reduce((sum, p) => sum + p.lng, 0) / slice.length;

        paradasLargas.push({
          startTimestamp: start.date.toISOString(),
          endTimestamp: curr.date.toISOString(),
          durationMin: Math.round(duration / (1000 * 60)),
          lat: avgLat,
          lng: avgLng,
        });

        // Reiniciar la parada para no duplicar muchos eventos solapados
        currentStopStartIndex = i;
      }
    } else {
      currentStopStartIndex = null;
    }
  }

  // Detección de presencia en ubicación de cliente
  let estuvoEnCliente = false;
  outer: for (const p of puntos) {
    for (const c of clientes) {
      const distKm = haversineKm(p.lat, p.lng, c.lat, c.lng);
      if (distKm <= clienteRadiusKm) {
        estuvoEnCliente = true;
        break outer;
      }
    }
  }

  return {
    totalDistanciaKm,
    maxSpeedKmh,
    paradasLargas,
    eventosVelocidad,
    estuvoEnCliente,
  };
}
