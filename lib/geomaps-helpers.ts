import { prisma } from "./prisma";

/**
 * Calcula la distancia entre dos puntos GPS usando la fórmula de Haversine
 * @returns distancia en metros
 */
export function calcularDistancia(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Radio de la Tierra en metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calcula la velocidad entre dos puntos GPS
 * @returns velocidad en km/h
 */
export function calcularVelocidad(
  lat1: number,
  lon1: number,
  timestamp1: Date,
  lat2: number,
  lon2: number,
  timestamp2: Date
): number {
  const distanciaMetros = calcularDistancia(lat1, lon1, lat2, lon2);
  const tiempoSegundos =
    (timestamp2.getTime() - timestamp1.getTime()) / 1000;

  if (tiempoSegundos === 0) return 0;

  const velocidadMps = distanciaMetros / tiempoSegundos;
  return velocidadMps * 3.6; // Convertir m/s a km/h
}

interface PuntoRuta {
  latitud: number;
  longitud: number;
  timestamp: Date;
}

interface ParadaDetectada {
  inicio: Date;
  fin: Date;
  duracionMinutos: number;
  latitud: number;
  longitud: number;
}

interface ExcesoVelocidad {
  timestamp: Date;
  velocidadKmh: number;
  latitud: number;
  longitud: number;
}

interface ProximidadCliente {
  ordenId: string;
  clienteNombre: string;
  distanciaMetros: number;
  timestamp: Date;
  dentroDelRadio: boolean;
}

export interface AnalisisRuta {
  distanciaTotal: number; // metros
  duracionTotal: number; // minutos
  velocidadMaxima: number; // km/h
  velocidadPromedio: number; // km/h
  paradas: ParadaDetectada[];
  excesosVelocidad: ExcesoVelocidad[];
  proximidadesClientes: ProximidadCliente[];
}

/**
 * Obtiene la configuración de Geomaps (o valores por defecto)
 */
async function obtenerConfiguracion() {
  let config = await prisma.configuracionGeomaps.findFirst();

  if (!config) {
    // Crear configuración por defecto si no existe
    config = await prisma.configuracionGeomaps.create({
      data: {
        duracionMinimaParada: 5,
        radioParada: 50,
        umbralVelocidadExcesiva: 80,
        radioProximidadCliente: 100,
        intervaloActualizacionGPS: 2,
      },
    });
  }

  return config;
}

/**
 * Analiza una ruta completa con reglas configurables
 */
export async function analizarRuta(
  puntos: PuntoRuta[],
  ordenes?: Array<{
    id: string;
    clienteNombre: string;
    clienteLat: number;
    clienteLng: number;
  }>
): Promise<AnalisisRuta> {
  const config = await obtenerConfiguracion();

  const analisis: AnalisisRuta = {
    distanciaTotal: 0,
    duracionTotal: 0,
    velocidadMaxima: 0,
    velocidadPromedio: 0,
    paradas: [],
    excesosVelocidad: [],
    proximidadesClientes: [],
  };

  if (puntos.length < 2) {
    return analisis;
  }

  // Ordenar puntos por timestamp
  const puntosOrdenados = [...puntos].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );

  // Calcular distancia total y detectar excesos de velocidad
  let distanciaAcumulada = 0;
  const velocidades: number[] = [];

  for (let i = 1; i < puntosOrdenados.length; i++) {
    const puntoAnterior = puntosOrdenados[i - 1];
    const puntoActual = puntosOrdenados[i];

    const distancia = calcularDistancia(
      puntoAnterior.latitud,
      puntoAnterior.longitud,
      puntoActual.latitud,
      puntoActual.longitud
    );

    distanciaAcumulada += distancia;

    const velocidad = calcularVelocidad(
      puntoAnterior.latitud,
      puntoAnterior.longitud,
      puntoAnterior.timestamp,
      puntoActual.latitud,
      puntoActual.longitud,
      puntoActual.timestamp
    );

    velocidades.push(velocidad);

    if (velocidad > analisis.velocidadMaxima) {
      analisis.velocidadMaxima = velocidad;
    }

    // Detectar exceso de velocidad
    if (velocidad > config.umbralVelocidadExcesiva) {
      analisis.excesosVelocidad.push({
        timestamp: puntoActual.timestamp,
        velocidadKmh: velocidad,
        latitud: puntoActual.latitud,
        longitud: puntoActual.longitud,
      });
    }
  }

  analisis.distanciaTotal = distanciaAcumulada;

  // Calcular duración total
  const tiempoTotal =
    (puntosOrdenados[puntosOrdenados.length - 1].timestamp.getTime() -
      puntosOrdenados[0].timestamp.getTime()) /
    60000; // minutos
  analisis.duracionTotal = tiempoTotal;

  // Calcular velocidad promedio
  if (velocidades.length > 0) {
    analisis.velocidadPromedio =
      velocidades.reduce((a, b) => a + b, 0) / velocidades.length;
  }

  // Detectar paradas largas
  let inicioParada: PuntoRuta | null = null;
  let ultimoPuntoParada: PuntoRuta | null = null;

  for (let i = 1; i < puntosOrdenados.length; i++) {
    const puntoAnterior = puntosOrdenados[i - 1];
    const puntoActual = puntosOrdenados[i];

    const distancia = calcularDistancia(
      puntoAnterior.latitud,
      puntoAnterior.longitud,
      puntoActual.latitud,
      puntoActual.longitud
    );

    // Si la distancia es menor al radio de parada, está detenido
    if (distancia <= config.radioParada) {
      if (!inicioParada) {
        inicioParada = puntoAnterior;
      }
      ultimoPuntoParada = puntoActual;
    } else {
      // Se movió, verificar si la parada fue lo suficientemente larga
      if (inicioParada && ultimoPuntoParada) {
        const duracionMinutos =
          (ultimoPuntoParada.timestamp.getTime() -
            inicioParada.timestamp.getTime()) /
          60000;

        if (duracionMinutos >= config.duracionMinimaParada) {
          analisis.paradas.push({
            inicio: inicioParada.timestamp,
            fin: ultimoPuntoParada.timestamp,
            duracionMinutos,
            latitud: inicioParada.latitud,
            longitud: inicioParada.longitud,
          });
        }
      }
      inicioParada = null;
      ultimoPuntoParada = null;
    }
  }

  // Verificar última parada si existe
  if (inicioParada && ultimoPuntoParada) {
    const duracionMinutos =
      (ultimoPuntoParada.timestamp.getTime() -
        inicioParada.timestamp.getTime()) /
      60000;

    if (duracionMinutos >= config.duracionMinimaParada) {
      analisis.paradas.push({
        inicio: inicioParada.timestamp,
        fin: ultimoPuntoParada.timestamp,
        duracionMinutos,
        latitud: inicioParada.latitud,
        longitud: inicioParada.longitud,
      });
    }
  }

  // Detectar proximidad a clientes
  if (ordenes && ordenes.length > 0) {
    for (const orden of ordenes) {
      let distanciaMinima = Infinity;
      let puntoMasCercano: PuntoRuta | null = null;

      for (const punto of puntosOrdenados) {
        const distancia = calcularDistancia(
          punto.latitud,
          punto.longitud,
          orden.clienteLat,
          orden.clienteLng
        );

        if (distancia < distanciaMinima) {
          distanciaMinima = distancia;
          puntoMasCercano = punto;
        }
      }

      if (puntoMasCercano) {
        analisis.proximidadesClientes.push({
          ordenId: orden.id,
          clienteNombre: orden.clienteNombre,
          distanciaMetros: distanciaMinima,
          timestamp: puntoMasCercano.timestamp,
          dentroDelRadio: distanciaMinima <= config.radioProximidadCliente,
        });
      }
    }
  }

  return analisis;
}
