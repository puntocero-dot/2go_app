import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRouteDirections } from "@/lib/mapbox-directions";

type RouteContext = { params: Promise<{ id: string }> };

// Simple in-memory cache for route geometry
const routeCache = new Map<string, { coordinates: number[][]; timestamp: number }>();
const CACHE_TTL_MS = 30_000; // 30 seconds

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get("token");
  const fromLat = parseFloat(searchParams.get("fromLat") || "");
  const fromLng = parseFloat(searchParams.get("fromLng") || "");

  if (!token) {
    return NextResponse.json({ error: "Token requerido" }, { status: 401 });
  }

  try {
    const orden = await prisma.orden.findUnique({
      where: { id },
      select: {
        linkMagicoToken: true,
        estado: true,
        armadorId: true,
        usuarioFinal: {
          select: {
            coordenadasLat: true,
            coordenadasLng: true,
          },
        },
        armador: {
          select: {
            ubicacionActualLat: true,
            ubicacionActualLng: true,
          },
        },
      },
    });

    if (!orden || orden.linkMagicoToken !== token) {
      return NextResponse.json({ error: "Token invalido" }, { status: 403 });
    }

    // Get armador position: prefer query params (most recent from client), fallback to DB
    const armadorLat = !isNaN(fromLat) ? fromLat : orden.armador?.ubicacionActualLat;
    const armadorLng = !isNaN(fromLng) ? fromLng : orden.armador?.ubicacionActualLng;
    const destLat = orden.usuarioFinal?.coordenadasLat;
    const destLng = orden.usuarioFinal?.coordenadasLng;

    if (!armadorLat || !armadorLng || !destLat || !destLng) {
      return NextResponse.json({ coordinates: null, message: "Coordenadas no disponibles" });
    }

    // Check cache
    const cacheKey = `${id}-${armadorLat.toFixed(3)}-${armadorLng.toFixed(3)}`;
    const cached = routeCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json({ coordinates: cached.coordinates });
    }

    // Fetch road-snapped route from Mapbox
    const result = await getRouteDirections(
      { lat: armadorLat, lng: armadorLng },
      { lat: destLat, lng: destLng },
      "driving-traffic"
    );

    if (result.route?.geometry?.coordinates) {
      const coordinates = result.route.geometry.coordinates;

      // Cache it
      routeCache.set(cacheKey, { coordinates, timestamp: Date.now() });

      // Clean old cache entries
      if (routeCache.size > 100) {
        const now = Date.now();
        for (const [key, val] of routeCache) {
          if (now - val.timestamp > CACHE_TTL_MS * 2) routeCache.delete(key);
        }
      }

      return NextResponse.json({ coordinates });
    }

    return NextResponse.json({ coordinates: null, message: "No se pudo calcular la ruta" });
  } catch (error) {
    console.error("Error fetching route:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
