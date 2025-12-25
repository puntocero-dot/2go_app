import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { turnoService } from "@/lib/services";
import { isFeatureEnabled } from "@/lib/feature-flags";

// POST - Actualizar ubicación del armador
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || session.rol !== "ARMADOR") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const { lat, lng } = body;

    if (typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json(
        { error: "Coordenadas inválidas" },
        { status: 400 }
      );
    }

    // Buscar el armador del usuario
    const armador = await prisma.armador.findUnique({
      where: { usuarioId: session.userId },
    });

    if (!armador) {
      return NextResponse.json(
        { error: "Armador no encontrado" },
        { status: 404 }
      );
    }

    // Usar Service Layer si el feature flag está habilitado (incluye smart sampling)
    const useServiceLayer = isFeatureEnabled('SERVICE_LAYER', session.userId, session.rol);
    
    if (useServiceLayer) {
      // Buscar turno activo
      const turnoActivo = await turnoService.obtenerTurnoActivo(armador.id);
      
      if (turnoActivo) {
        // guardarUbicacion incluye smart sampling automático
        const punto = await turnoService.guardarUbicacion({
          turnoId: turnoActivo.id,
          ubicacion: { lat, lng },
        });
        
        return NextResponse.json({
          message: "Ubicación actualizada",
          armador: {
            id: armador.id,
            lat,
            lng,
            ultimaActualizacion: new Date(),
          },
          rutaGuardada: punto !== null,
          smartSampling: punto === null, // true si fue omitido por smart sampling
        });
      }
      
      // Sin turno activo, solo actualizar ubicación del armador
      await prisma.armador.update({
        where: { id: armador.id },
        data: {
          ubicacionActualLat: lat,
          ubicacionActualLng: lng,
          ultimaActualizacionGPS: new Date(),
        },
      });
      
      return NextResponse.json({
        message: "Ubicación actualizada (sin turno activo)",
        armador: { id: armador.id, lat, lng, ultimaActualizacion: new Date() },
        rutaGuardada: false,
      });
    }

    // Lógica original (sin Service Layer ni smart sampling)
    // Buscar turno activo
    const turnoActivo = await prisma.turno.findFirst({
      where: {
        armadorId: armador.id,
        estado: "ACTIVO",
      },
      orderBy: {
        inicioTurno: "desc",
      },
    });

    // Actualizar ubicación del armador y guardar punto de ruta si hay turno activo
    const armadorActualizado = await prisma.armador.update({
      where: { id: armador.id },
      data: {
        ubicacionActualLat: lat,
        ubicacionActualLng: lng,
        ultimaActualizacionGPS: new Date(),
      },
    });

    // Si hay turno activo, guardar punto de ruta
    if (turnoActivo) {
      await prisma.rutaPunto.create({
        data: {
          turnoId: turnoActivo.id,
          latitud: lat,
          longitud: lng,
          tipo: "INTERMEDIO",
        },
      });
    }

    return NextResponse.json({
      message: "Ubicación actualizada",
      armador: {
        id: armadorActualizado.id,
        lat: armadorActualizado.ubicacionActualLat,
        lng: armadorActualizado.ubicacionActualLng,
        ultimaActualizacion: armadorActualizado.ultimaActualizacionGPS,
      },
      rutaGuardada: !!turnoActivo,
    });
  } catch (error) {
    console.error("Error actualizando ubicación:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}