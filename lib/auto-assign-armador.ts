import { prisma } from "@/lib/prisma";

export async function asignarArmadorAutomatico(orden: any) {
  try {
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
