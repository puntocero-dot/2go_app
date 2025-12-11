/**
 * Implementación del algoritmo de Google Polyline Encoding
 * https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 * 
 * Reduce ~70% el tamaño de almacenamiento de coordenadas GPS
 */

export interface Coordenadas {
  lat: number;
  lng: number;
}

/**
 * Codifica un número usando el algoritmo de Google Polyline
 */
function encodeNumber(num: number): string {
  let signedNum = num << 1;
  if (num < 0) {
    signedNum = ~signedNum;
  }

  let resultado = '';
  while (signedNum >= 0x20) {
    const chunk = (signedNum & 0x1f) | 0x20;
    resultado += String.fromCharCode(chunk + 63);
    signedNum >>= 5;
  }
  resultado += String.fromCharCode(signedNum + 63);

  return resultado;
}

/**
 * Decodifica un número del string encoded
 */
function decodeNumber(encoded: string, index: number): [number, number] {
  let resultado = 0;
  let shift = 0;
  let b: number;

  do {
    b = encoded.charCodeAt(index++) - 63;
    resultado |= (b & 0x1f) << shift;
    shift += 5;
  } while (b >= 0x20);

  const dNum = resultado & 1 ? ~(resultado >> 1) : resultado >> 1;
  return [dNum, index];
}

/**
 * Codifica un array de coordenadas en un string comprimido
 * @param puntos Array de coordenadas {lat, lng}
 * @returns String comprimido con el algoritmo Polyline
 */
export function encodePolyline(puntos: Coordenadas[]): string {
  if (puntos.length === 0) return '';

  let resultado = '';
  let latAnterior = 0;
  let lngAnterior = 0;

  for (const punto of puntos) {
    // Convertir a enteros (E5: multiplicar por 10^5)
    const lat = Math.round(punto.lat * 1e5);
    const lng = Math.round(punto.lng * 1e5);

    // Calcular diferencias
    const dLat = lat - latAnterior;
    const dLng = lng - lngAnterior;

    // Codificar diferencias
    resultado += encodeNumber(dLat);
    resultado += encodeNumber(dLng);

    latAnterior = lat;
    lngAnterior = lng;
  }

  return resultado;
}

/**
 * Decodifica un string comprimido a array de coordenadas
 * @param encoded String comprimido con algoritmo Polyline
 * @returns Array de coordenadas {lat, lng}
 */
export function decodePolyline(encoded: string): Coordenadas[] {
  if (!encoded) return [];

  const puntos: Coordenadas[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    // Decodificar latitud
    const [dLat, newIndex1] = decodeNumber(encoded, index);
    lat += dLat;
    index = newIndex1;

    // Decodificar longitud
    const [dLng, newIndex2] = decodeNumber(encoded, index);
    lng += dLng;
    index = newIndex2;

    puntos.push({
      lat: lat / 1e5,
      lng: lng / 1e5,
    });
  }

  return puntos;
}

/**
 * Calcular estadísticas de compresión
 */
export function calcularCompresion(puntos: Coordenadas[]): {
  sizeOriginal: number;
  sizeComprimido: number;
  porcentajeReduccion: number;
} {
  // Tamaño original: cada punto = 2 floats × 8 bytes = 16 bytes
  const sizeOriginal = puntos.length * 16;

  // Tamaño comprimido
  const encoded = encodePolyline(puntos);
  const sizeComprimido = encoded.length;

  const porcentajeReduccion =
    sizeOriginal > 0
      ? ((sizeOriginal - sizeComprimido) / sizeOriginal) * 100
      : 0;

  return {
    sizeOriginal,
    sizeComprimido,
    porcentajeReduccion: Math.round(porcentajeReduccion * 10) / 10,
  };
}

/**
 * Simplificar ruta usando algoritmo Douglas-Peucker
 * Reduce el número de puntos manteniendo la forma general
 */
export function simplificarRuta(
  puntos: Coordenadas[],
  tolerancia: number = 0.00001
): Coordenadas[] {
  if (puntos.length <= 2) return puntos;

  // Encontrar el punto más lejano de la línea entre el primero y el último
  let maxDistancia = 0;
  let maxIndex = 0;

  const inicio = puntos[0];
  const fin = puntos[puntos.length - 1];

  for (let i = 1; i < puntos.length - 1; i++) {
    const distancia = distanciaPuntoALinea(puntos[i], inicio, fin);
    if (distancia > maxDistancia) {
      maxDistancia = distancia;
      maxIndex = i;
    }
  }

  // Si la distancia máxima es mayor que la tolerancia, dividir y recursionar
  if (maxDistancia > tolerancia) {
    const izquierda = simplificarRuta(puntos.slice(0, maxIndex + 1), tolerancia);
    const derecha = simplificarRuta(puntos.slice(maxIndex), tolerancia);

    // Combinar resultados (sin duplicar el punto medio)
    return [...izquierda.slice(0, -1), ...derecha];
  }

  // Si no, devolver solo los extremos
  return [inicio, fin];
}

/**
 * Calcular distancia perpendicular de un punto a una línea
 */
function distanciaPuntoALinea(
  punto: Coordenadas,
  lineaInicio: Coordenadas,
  lineaFin: Coordenadas
): number {
  const dx = lineaFin.lng - lineaInicio.lng;
  const dy = lineaFin.lat - lineaInicio.lat;

  if (dx === 0 && dy === 0) {
    // La línea es un punto
    return Math.sqrt(
      Math.pow(punto.lng - lineaInicio.lng, 2) +
        Math.pow(punto.lat - lineaInicio.lat, 2)
    );
  }

  const t = Math.max(
    0,
    Math.min(
      1,
      ((punto.lng - lineaInicio.lng) * dx + (punto.lat - lineaInicio.lat) * dy) /
        (dx * dx + dy * dy)
    )
  );

  const proyeccionX = lineaInicio.lng + t * dx;
  const proyeccionY = lineaInicio.lat + t * dy;

  return Math.sqrt(
    Math.pow(punto.lng - proyeccionX, 2) + Math.pow(punto.lat - proyeccionY, 2)
  );
}
