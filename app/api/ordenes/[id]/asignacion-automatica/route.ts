import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface ArmadorCandidato {
  id: string;
  nombre: string;
  telefono: string | null;
  ordenesActivas: number;
  experienciaAnios: number;
  ubicacionActualLat: number | null;
  ubicacionActualLng: number | null;
}

function calcularScore(armador: ArmadorCandidato) {
  let score = 100;

  // Penalizar órdenes activas
  score -= armador.ordenesActivas * 12;

  // Bonificar experiencia
  score += armador.experienciaAnios * 4;

  // Bonificar si contamos con ubicación
  if (armador.ubicacionActualLat !== null && armador.ubicacionActualLng !== null) {
    score += 6;
  }

  return Math.max(score, 0);
}

function estimarEtaMinutos(score: number) {
  const base = 180;
  const ajuste = Math.min(score, 80);
  return Math.max(Math.round(base - ajuste), 45);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const session = await getSession();

    if (!session || !["ADMIN", "SUPERVISOR"].includes(session.rol)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const orden = await prisma.orden.findUnique({
      where: { id },
      include: {
        usuarioFinal: {
          select: {
            municipio: true,
            departamento: true,
          },
        },
      },
    });

    if (!orden) {
      return NextResponse.json(
        { error: "Orden no encontrada" },
        { status: 404 }
      );
    }

    const armadores = await prisma.armador.findMany({
      where: {
        estado: "ACTIVO",
        usuario: { activo: true },
      },
      include: {
        usuario: {
          select: {
            nombre: true,
            telefono: true,
          },
        },
        ordenes: {
          where: {
            estado: {
              in: ["ASIGNADO", "EN_RUTA", "ARMADO_INICIADO"],
            },
          },
          select: { id: true },
        },
      },
    });

    if (armadores.length === 0) {
      return NextResponse.json({ message: "No hay armadores disponibles" });
    }

    const candidatos = armadores.map<ArmadorCandidato>((armador) => {
      const aniosExperiencia = Math.max(
        0,
        Math.floor(
          (Date.now() - armador.fechaContratacion.getTime()) /
            (1000 * 60 * 60 * 24 * 365)
        )
      );

      return {
        id: armador.id,
        nombre: armador.usuario.nombre,
        telefono: armador.usuario.telefono ?? null,
        ordenesActivas: armador.ordenes.length,
        experienciaAnios: aniosExperiencia,
        ubicacionActualLat: armador.ubicacionActualLat,
        ubicacionActualLng: armador.ubicacionActualLng,
      };
    });

    const candidatosConScore = candidatos.map((candidato) => {
      const scoreBase = calcularScore(candidato);

      return {
        ...candidato,
        score: scoreBase,
        etaMinutos: estimarEtaMinutos(scoreBase),
      };
    });

    candidatosConScore.sort((a, b) => b.score - a.score);

    const principal = candidatosConScore[0];
    const alternativas = candidatosConScore.slice(1, 3);

    return NextResponse.json({
      ordenId: id,
      sugerencia: {
        armadorId: principal.id,
        nombre: principal.nombre,
        telefono: principal.telefono,
        score: principal.score,
        etaEstimadoMin: principal.etaMinutos,
      },
      alternativas: alternativas.map((alt) => ({
        armadorId: alt.id,
        nombre: alt.nombre,
        score: alt.score,
        etaEstimadoMin: alt.etaMinutos,
      })),
      heuristica: "Stub heurístico basado en carga y antigüedad",
    });
  } catch (error) {
    console.error("Error generando asignación automática:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}