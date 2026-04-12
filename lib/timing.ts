/**
 * Utilidad para calcular y almacenar tiempos acumulados por estado en ordenes.
 * Extrae la logica que antes se calculaba on-the-fly en reportes y la pre-computa
 * en el campo Orden.tiempoAcumuladoEstados (Json) en cada transicion de estado.
 */

import { prisma } from "@/lib/prisma";

/**
 * Calcula los segundos acumulados en cada estado para una orden.
 * Recorre los RegistroEstado en orden cronologico y mide el tiempo
 * entre transiciones consecutivas.
 *
 * Para el ultimo estado (si la orden no esta completada/cancelada),
 * acumula tiempo hasta el momento actual.
 */
export async function computeAccumulatedTimes(
  ordenId: string
): Promise<Record<string, number>> {
  const registros = await prisma.registroEstado.findMany({
    where: { ordenId },
    orderBy: { timestamp: "asc" },
    select: {
      estadoCambiadoA: true,
      timestamp: true,
    },
  });

  const tiempos: Record<string, number> = {};

  if (registros.length === 0) return tiempos;

  for (let i = 0; i < registros.length; i++) {
    const registro = registros[i];
    const estado = registro.estadoCambiadoA;

    let duracionSegundos: number;

    if (i < registros.length - 1) {
      // Tiempo desde esta transicion hasta la siguiente
      const siguiente = registros[i + 1];
      duracionSegundos =
        (siguiente.timestamp.getTime() - registro.timestamp.getTime()) / 1000;
    } else {
      // Ultimo estado: acumular hasta ahora (solo si no es estado terminal)
      const estadosTerminales = ["ARMADO_COMPLETADO", "CANCELADA"];
      if (estadosTerminales.includes(estado)) {
        duracionSegundos = 0;
      } else {
        duracionSegundos =
          (Date.now() - registro.timestamp.getTime()) / 1000;
      }
    }

    // Acumular (un estado podria aparecer mas de una vez si hubo reversa)
    tiempos[estado] = (tiempos[estado] || 0) + Math.round(duracionSegundos);
  }

  return tiempos;
}

/**
 * Calcula los tiempos acumulados y los persiste en Orden.tiempoAcumuladoEstados.
 * Llamar despues de cada transicion de estado.
 */
export async function computeAndStoreAccumulatedTimes(
  ordenId: string
): Promise<void> {
  const tiempos = await computeAccumulatedTimes(ordenId);

  await prisma.orden.update({
    where: { id: ordenId },
    data: {
      tiempoAcumuladoEstados: tiempos,
    },
  });
}
