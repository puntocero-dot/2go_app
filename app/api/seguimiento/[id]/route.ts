import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRouteDirections, formatDuration } from "@/lib/mapbox-directions";
import { getEtaCache, setEtaCache } from "@/lib/eta-cache";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { aplicarCorreccionETA } from "@/lib/ai/eta-predictor";

type RouteContext = { params: Promise<{ id: string }> };

interface EtaResponse {
  disponible: boolean;
  minutosEstimados: number | null;
  minutosMin: number | null;
  minutosMax: number | null;
  distanciaKm: number | null;
  horaLlegadaEstimada: string | null;
  duracionTexto: string | null;
  armadorUbicacion: {
    lat: number;
    lng: number;
    actualizadoHace: string;
  } | null;
  mensaje: string;
}

function formatTimeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "hace menos de 1 min";
  if (diffMin === 1) return "hace 1 min";
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs === 1) return "hace 1 hora";
  return `hace ${diffHrs} horas`;
}

// GET - Obtener informacion de seguimiento publico (requiere token magico)
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params;
  const token = request.nextUrl.searchParams.get("token");

  // Requiere token para acceso publico
  if (!token) {
    return NextResponse.json(
      { error: "Token de seguimiento requerido" },
      { status: 401 }
    );
  }

  try {
    // Buscar por ID y validar que el token coincida
    const orden = await prisma.orden.findUnique({
      where: { id },
      select: {
        id: true,
        codigoReferenciaRetail: true,
        estado: true,
        fechaSolicitadaCliente: true,
        fechaAsignacion: true,
        fechaRuta: true,
        fechaInicioArmado: true,
        fechaFinArmado: true,
        fechaCompletado: true,
        linkMagicoToken: true,
        armadorId: true,
        mueble: {
          select: {
            nombre: true,
            descripcion: true,
          },
        },
        usuarioFinal: {
          select: {
            nombre: true,
            municipio: true,
            coordenadasLat: true,
            coordenadasLng: true,
          },
        },
        armador: {
          include: {
            usuario: {
              select: {
                nombre: true,
              },
            },
          },
        },
        registrosEstado: {
          orderBy: { timestamp: "desc" },
          select: {
            estadoCambiadoA: true,
            timestamp: true,
            comentario: true,
            etaEstimado: true,
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

    // Validar token magico
    if (orden.linkMagicoToken !== token) {
      return NextResponse.json(
        { error: "Token de seguimiento invalido" },
        { status: 403 }
      );
    }

    // Calcular ETA segun el estado
    const eta = await computeEta(orden);

    // Remover campos sensibles de la respuesta
    const { linkMagicoToken: _token, armadorId: _armId, ...ordenSegura } = orden;

    // Remover coordenadas del cliente de la respuesta publica
    if (ordenSegura.usuarioFinal) {
      const { coordenadasLat: _lat, coordenadasLng: _lng, ...ufSeguro } = ordenSegura.usuarioFinal;
      return NextResponse.json({
        orden: { ...ordenSegura, usuarioFinal: ufSeguro },
        eta,
      });
    }

    return NextResponse.json({ orden: ordenSegura, eta });
  } catch {
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

/**
 * Calcula el ETA basado en el estado actual de la orden.
 * Para EN_RUTA: usa Mapbox Directions API con cache.
 * Para otros estados: retorna mensaje descriptivo.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function computeEta(orden: any): Promise<EtaResponse> {
  const noEta: EtaResponse = {
    disponible: false,
    minutosEstimados: null,
    minutosMin: null,
    minutosMax: null,
    distanciaKm: null,
    horaLlegadaEstimada: null,
    duracionTexto: null,
    armadorUbicacion: null,
    mensaje: "",
  };
  const usePredictiveEta = isFeatureEnabled('PREDICTIVE_ETA');

  switch (orden.estado) {
    case "SIN_ASIGNAR":
      return { ...noEta, mensaje: "Estamos buscando un armador para tu pedido." };

    case "ASIGNADO":
      return {
        ...noEta,
        mensaje: "Tu armador ha sido asignado y pronto estara en camino.",
      };

    case "EN_RUTA": {
      // Intentar calcular ETA real con Mapbox
      if (!orden.armadorId) {
        return { ...noEta, mensaje: "Tu armador esta en camino." };
      }

      // Obtener ubicacion actual del armador
      const armador = await prisma.armador.findUnique({
        where: { id: orden.armadorId },
        select: {
          ubicacionActualLat: true,
          ubicacionActualLng: true,
          ultimaActualizacionGPS: true,
        },
      });

      if (
        !armador?.ubicacionActualLat ||
        !armador?.ubicacionActualLng ||
        !orden.usuarioFinal?.coordenadasLat ||
        !orden.usuarioFinal?.coordenadasLng
      ) {
        // Sin coordenadas, intentar usar ETA del ultimo RegistroEstado
        const etaRegistro = orden.registrosEstado?.find(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (r: any) => r.etaEstimado && r.estadoCambiadoA === "EN_RUTA"
        );
        if (etaRegistro?.etaEstimado) {
          const etaDate = new Date(etaRegistro.etaEstimado);
          const minutosRestantes = Math.max(
            0,
            Math.round((etaDate.getTime() - Date.now()) / 60000)
          );
          return {
            ...noEta,
            disponible: true,
            minutosEstimados: minutosRestantes,
            horaLlegadaEstimada: etaDate.toISOString(),
            mensaje: `Llegada estimada en ~${minutosRestantes} minutos.`,
          };
        }
        return { ...noEta, mensaje: "Tu armador esta en camino." };
      }

      // Verificar cache
      const cached = getEtaCache(orden.id);
      if (cached) {
        const etaSeconds = cached.etaSeconds;
        const distanciaKm = Math.round(cached.distanceMeters / 100) / 10;

        if (usePredictiveEta && orden.usuarioFinal?.municipio) {
          const corregido = await aplicarCorreccionETA(etaSeconds, orden.usuarioFinal.municipio);
          const horaLlegada = new Date(Date.now() + corregido.segundosCentral * 1000);
          const minutosMin = Math.round(corregido.segundosMin / 60);
          const minutosMax = Math.round(corregido.segundosMax / 60);
          const minutosCentral = Math.round(corregido.segundosCentral / 60);
          return {
            disponible: true,
            minutosEstimados: minutosCentral,
            minutosMin,
            minutosMax,
            distanciaKm,
            horaLlegadaEstimada: horaLlegada.toISOString(),
            duracionTexto: formatDuration(corregido.segundosCentral),
            armadorUbicacion: {
              lat: armador.ubicacionActualLat,
              lng: armador.ubicacionActualLng,
              actualizadoHace: formatTimeAgo(armador.ultimaActualizacionGPS || new Date()),
            },
            mensaje: `Tu armador llegará en aproximadamente ${minutosMin}-${minutosMax} minutos.`,
          };
        }

        const minutosEstimados = Math.round(etaSeconds / 60);
        const horaLlegada = new Date(Date.now() + etaSeconds * 1000);
        return {
          disponible: true,
          minutosEstimados,
          minutosMin: null,
          minutosMax: null,
          distanciaKm,
          horaLlegadaEstimada: horaLlegada.toISOString(),
          duracionTexto: formatDuration(etaSeconds),
          armadorUbicacion: {
            lat: armador.ubicacionActualLat,
            lng: armador.ubicacionActualLng,
            actualizadoHace: formatTimeAgo(armador.ultimaActualizacionGPS || new Date()),
          },
          mensaje: `Tu armador llegara en aproximadamente ${minutosEstimados} minutos.`,
        };
      }

      // Calcular con Mapbox Directions API
      const result = await getRouteDirections(
        {
          lat: armador.ubicacionActualLat,
          lng: armador.ubicacionActualLng,
        },
        {
          lat: orden.usuarioFinal.coordenadasLat,
          lng: orden.usuarioFinal.coordenadasLng,
        },
        "driving-traffic"
      );

      if (result.route) {
        // Guardar en cache (siempre el valor crudo de Mapbox)
        setEtaCache(orden.id, {
          lastGpsTimestamp: armador.ultimaActualizacionGPS || new Date(),
          etaSeconds: result.route.duration,
          distanceMeters: result.route.distance,
        });

        const distanciaKm = Math.round(result.route.distance / 100) / 10;

        if (usePredictiveEta && orden.usuarioFinal?.municipio) {
          const corregido = await aplicarCorreccionETA(result.route.duration, orden.usuarioFinal.municipio);
          const horaLlegada = new Date(Date.now() + corregido.segundosCentral * 1000);
          const minutosMin = Math.round(corregido.segundosMin / 60);
          const minutosMax = Math.round(corregido.segundosMax / 60);
          const minutosCentral = Math.round(corregido.segundosCentral / 60);
          return {
            disponible: true,
            minutosEstimados: minutosCentral,
            minutosMin,
            minutosMax,
            distanciaKm,
            horaLlegadaEstimada: horaLlegada.toISOString(),
            duracionTexto: formatDuration(corregido.segundosCentral),
            armadorUbicacion: {
              lat: armador.ubicacionActualLat,
              lng: armador.ubicacionActualLng,
              actualizadoHace: formatTimeAgo(armador.ultimaActualizacionGPS || new Date()),
            },
            mensaje: `Tu armador llegará en aproximadamente ${minutosMin}-${minutosMax} minutos.`,
          };
        }

        const minutosEstimados = Math.round(result.route.duration / 60);
        const horaLlegada = new Date(Date.now() + result.route.duration * 1000);
        return {
          disponible: true,
          minutosEstimados,
          minutosMin: null,
          minutosMax: null,
          distanciaKm,
          horaLlegadaEstimada: horaLlegada.toISOString(),
          duracionTexto: formatDuration(result.route.duration),
          armadorUbicacion: {
            lat: armador.ubicacionActualLat,
            lng: armador.ubicacionActualLng,
            actualizadoHace: formatTimeAgo(armador.ultimaActualizacionGPS || new Date()),
          },
          mensaje: `Tu armador llegara en aproximadamente ${minutosEstimados} minutos.`,
        };
      }

      // Mapbox fallo, intentar ETA del RegistroEstado
      return { ...noEta, mensaje: "Tu armador esta en camino." };
    }

    case "ARMADO_INICIADO":
      return {
        ...noEta,
        mensaje: "Tu armador esta en sitio trabajando en tu mueble.",
      };

    case "ARMADO_FINALIZADO":
      return {
        ...noEta,
        mensaje: "El armado de tu mueble ha finalizado.",
      };

    case "ARMADO_COMPLETADO":
      return {
        ...noEta,
        mensaje: "Tu pedido ha sido completado exitosamente.",
      };

    case "CANCELADA":
      return {
        ...noEta,
        mensaje: "Este pedido fue cancelado.",
      };

    default:
      return { ...noEta, mensaje: "" };
  }
}