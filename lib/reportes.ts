import { prisma } from "./prisma";

export async function getProyectosParaFiltros() {
  return prisma.proyecto.findMany({
    select: {
      id: true,
      nombreComercial: true,
    },
    orderBy: {
      nombreComercial: "asc",
    },
  });
}

export async function getArmadoresParaFiltros() {
  return prisma.armador.findMany({
    select: {
      id: true,
      usuario: {
        select: {
          nombre: true,
        },
      },
    },
    orderBy: {
      usuario: {
        nombre: "asc",
      },
    },
  });
}

