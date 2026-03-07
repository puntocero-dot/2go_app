import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getRouteDirections, formatDuration, formatDistance } from "@/lib/mapbox-directions";

type RouteContext = { params: Promise<{ id: string }> };

// GET - Obtener ruta sugerida desde ubicación actual hasta destino
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const origenLat = parseFloat(searchParams.get("origenLat") || "");
    const origenLng = parseFloat(searchParams.get("origenLng") || "");
    const destinoLat = parseFloat(searchParams.get("destinoLat") || "");
    const destinoLng = parseFloat(searchParams.get("destinoLng") || "");

    if (isNaN(origenLat) || isNaN(origenLng) || isNaN(destinoLat) || isNaN(destinoLng)) {
      return NextResponse.json(
        { error: "Coordenadas inválidas" },
        { status: 400 }
      );
    }

    const direcciones = await getRouteDirections(
      { lat: origenLat, lng: origenLng },
      { lat: destinoLat, lng: destinoLng },
      'driving-traffic'
    );

    if (!direcciones.route) {
      return NextResponse.json(
        { rutaSugerida: null, error: direcciones.error },
        { status: 200 }
      );
    }

    return NextResponse.json({
      rutaSugerida: {
        distancia: formatDistance(direcciones.route.distance),
        distanciaMetros: direcciones.route.distance,
        duracion: formatDuration(direcciones.route.duration),
        duracionSegundos: direcciones.route.duration,
        geometry: direcciones.route.geometry,
      },
    });
  } catch (error) {
    console.error("Error obteniendo ruta sugerida:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
