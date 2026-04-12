import { prisma } from "@/lib/prisma";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { seleccionarMejorArmador } from "@/lib/ai/smart-assignment";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function asignarArmadorAutomatico(_orden: any) {
  try {
    // Si el flag AI_SMART_ASSIGNMENT está activo, usar scoring histórico
    if (isFeatureEnabled('AI_SMART_ASSIGNMENT') && _orden?.id && _orden?.muebleId && _orden?.usuarioFinalId) {
      const armador = await seleccionarMejorArmador({
        id: _orden.id,
        muebleId: _orden.muebleId,
        usuarioFinalId: _orden.usuarioFinalId,
      });
      if (armador) return armador;
      // Si falla (sin datos históricos), cae al algoritmo original abajo
    }

    const armadores = await prisma.armador.findMany({
      where: {
        estado: "ACTIVO",
        usuario: {
          activo: true,
        },
      },
      include: {
        usuario: true,
        ordenes: {
          where: {
            estado: {
              in: ["ASIGNADO", "EN_RUTA", "ARMADO_INICIADO"],
            },
          },
        },
      },
    });

    if (armadores.length === 0) {
      return null;
    }

    const armadoresConScore = armadores.map((armador) => {
      let score = 100;

      score -= armador.ordenes.length * 10;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyArmador = armador as any;
      if (typeof anyArmador.calificacionPromedio === "number") {
        score += anyArmador.calificacionPromedio * 5;
      }

      const experienciaAnios =
        typeof anyArmador.experienciaAnios === "number"
          ? anyArmador.experienciaAnios
          : 0;
      score += experienciaAnios * 2;

      score += 10;

      return {
        armador,
        score,
      };
    });

    armadoresConScore.sort((a, b) => b.score - a.score);

    return armadoresConScore[0].armador;
  } catch (error) {
    console.error("Error en asignación automática:", error);
    return null;
  }
}
