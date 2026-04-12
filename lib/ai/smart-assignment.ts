/**
 * Smart Assignment v1 — Scoring basado en datos históricos reales.
 *
 * Reemplaza la fórmula estática de auto-assign-armador.ts con un scoring
 * data-driven que considera rendimiento histórico, CSAT, carga actual
 * y distancia al cliente.
 *
 * Score ponderado:
 *   carga       (peso -15): órdenes activas penalizan
 *   csat        (peso +8):  promedio de calificaciones del cliente
 *   velocidad   (peso +10): qué tan rápido llega en promedio vs estimado
 *   expertise   (peso +12): historial completando el mismo tamaño de mueble
 *   distancia   (peso -2):  km desde ubicación actual hasta el cliente
 */

import { prisma } from "@/lib/prisma";
import { calcularDistancia } from "@/lib/geomaps-helpers";

export interface CandidatoScore {
  armadorId: string;
  score: number;
  breakdown: {
    carga: number;
    csat: number;
    velocidad: number;
    expertise: number;
    distancia: number;
  };
}

interface OrdenInput {
  id: string;
  muebleId: string;
  usuarioFinalId: string;
}

/**
 * Calcula scores para todos los armadores activos frente a una orden dada.
 * Retorna el array ordenado de mayor a menor score.
 */
export async function calcularScoresArmadores(
  orden: OrdenInput
): Promise<CandidatoScore[]> {
  // 1. Obtener datos del mueble y cliente
  const [mueble, clienteFinal] = await Promise.all([
    prisma.mueble.findUnique({
      where: { id: orden.muebleId },
      select: { tamano: true },
    }),
    prisma.usuarioFinal.findUnique({
      where: { id: orden.usuarioFinalId },
      select: { coordenadasLat: true, coordenadasLng: true },
    }),
  ]);

  // 2. Obtener armadores activos con órdenes en curso
  const armadores = await prisma.armador.findMany({
    where: {
      estado: "ACTIVO",
      usuario: { activo: true },
    },
    select: {
      id: true,
      ubicacionActualLat: true,
      ubicacionActualLng: true,
      ordenes: {
        where: {
          estado: { in: ["ASIGNADO", "EN_RUTA", "ARMADO_INICIADO"] },
        },
        select: { id: true },
      },
    },
  });

  if (armadores.length === 0) return [];

  const armadorIds = armadores.map((a) => a.id);

  // 3. Consulta histórica en una sola query agregada
  const [historialCsat, historialVelocidad, historialExpertise] =
    await Promise.all([
      // CSAT promedio por armador (últimas 50 órdenes completadas)
      prisma.orden.groupBy({
        by: ["armadorId"],
        where: {
          armadorId: { in: armadorIds },
          estado: "ARMADO_COMPLETADO",
          csatPuntaje: { not: null },
        },
        _avg: { csatPuntaje: true },
        _count: { id: true },
      }),

      // Tiempo promedio EN_RUTA→ARMADO_INICIADO (velocidad de llegada)
      // Usamos raw para calcular diffs de timestamps en PostgreSQL
      prisma.$queryRaw<
        { armador_id: string; avg_arrival_min: number; count: bigint }[]
      >`
        SELECT
          o."armadorId" AS armador_id,
          AVG(
            EXTRACT(EPOCH FROM (re_llega."timestamp" - re_ruta."timestamp")) / 60.0
          ) AS avg_arrival_min,
          COUNT(*) AS count
        FROM ordenes o
        JOIN registros_estado re_ruta
          ON re_ruta."ordenId" = o.id
          AND re_ruta."estadoCambiadoA" = 'EN_RUTA'
        JOIN registros_estado re_llega
          ON re_llega."ordenId" = o.id
          AND re_llega."estadoCambiadoA" = 'ARMADO_INICIADO'
        WHERE o."armadorId" = ANY(${armadorIds})
          AND re_llega."timestamp" > re_ruta."timestamp"
        GROUP BY o."armadorId"
      `,

      // Órdenes completadas por armador con el mismo tamaño de mueble
      mueble
        ? prisma.orden.groupBy({
            by: ["armadorId"],
            where: {
              armadorId: { in: armadorIds },
              estado: "ARMADO_COMPLETADO",
              mueble: { tamano: mueble.tamano },
            },
            _count: { id: true },
          })
        : Promise.resolve([]),
    ]);

  // 4. Construir mapas para lookup O(1)
  const csatMap = new Map(
    historialCsat.map((r) => [r.armadorId, r._avg.csatPuntaje ?? 3])
  );
  const velocidadMap = new Map(
    historialVelocidad.map((r) => [r.armador_id, Number(r.avg_arrival_min)])
  );
  const expertiseMap = new Map(
    historialExpertise.map((r) => [r.armadorId, r._count.id])
  );

  // Promedio global de llegada para normalizar (fallback 20 min)
  const tiemposLlegada = [...velocidadMap.values()];
  const promedioGlobal =
    tiemposLlegada.length > 0
      ? tiemposLlegada.reduce((s, v) => s + v, 0) / tiemposLlegada.length
      : 20;

  // 5. Calcular score para cada armador
  const scores: CandidatoScore[] = armadores.map((armador) => {
    // Carga: penalizar por órdenes activas
    const cargaScore = -(armador.ordenes.length * 15);

    // CSAT: 1-5 → 0-40 puntos
    const csatVal = csatMap.get(armador.id) ?? 3;
    const csatScore = csatVal * 8;

    // Velocidad: si llega más rápido que el promedio → bonus
    const avgLlegada = velocidadMap.get(armador.id);
    const velocidadScore =
      avgLlegada !== undefined
        ? Math.round(((promedioGlobal - avgLlegada) / promedioGlobal) * 10)
        : 0;

    // Expertise: log2 del número de muebles del mismo tamaño completados
    const expertiseCount = expertiseMap.get(armador.id) ?? 0;
    const expertiseScore = Math.round(Math.log2(expertiseCount + 1) * 4);

    // Distancia: si tenemos coordenadas de ambos
    let distanciaScore = 0;
    if (
      armador.ubicacionActualLat &&
      armador.ubicacionActualLng &&
      clienteFinal?.coordenadasLat &&
      clienteFinal?.coordenadasLng
    ) {
      const distKm =
        calcularDistancia(
          armador.ubicacionActualLat,
          armador.ubicacionActualLng,
          clienteFinal.coordenadasLat,
          clienteFinal.coordenadasLng
        ) / 1000;
      distanciaScore = -(distKm * 2);
    }

    const score =
      100 + cargaScore + csatScore + velocidadScore + expertiseScore + distanciaScore;

    return {
      armadorId: armador.id,
      score: Math.round(score),
      breakdown: {
        carga: cargaScore,
        csat: csatScore,
        velocidad: velocidadScore,
        expertise: expertiseScore,
        distancia: distanciaScore,
      },
    };
  });

  scores.sort((a, b) => b.score - a.score);
  return scores;
}

/**
 * Retorna el mejor armador para la orden dada usando scoring histórico.
 * Retorna null si no hay armadores disponibles.
 */
export async function seleccionarMejorArmador(orden: OrdenInput) {
  const scores = await calcularScoresArmadores(orden);
  if (scores.length === 0) return null;

  const mejor = scores[0];

  const armador = await prisma.armador.findUnique({
    where: { id: mejor.armadorId },
    include: { usuario: true },
  });

  return armador;
}
