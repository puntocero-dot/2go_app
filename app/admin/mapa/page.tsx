import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { Label } from "@/components/ui/label";
import MapaDashboard from "@/components/mapa-dashboard";
import { MapPin, AlertTriangle } from "lucide-react";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import Link from "next/link";
import { MapaFilters } from "@/components/mapa/mapa-filters";

export const dynamic = 'force-dynamic';

type Usuario = {
  nombre: string;
  email: string;
  rol: "ADMIN" | "SUPERVISOR" | "ARMADOR";
};

async function getMapData(userId: string, rol: string) {
  // Si es SUPERVISOR, obtener solo sus proyectos asignados
  let proyectoIds: string[] | null = null;
  
  if (rol === 'SUPERVISOR') {
    const supervisorProyectos = await prisma.supervisorProyecto.findMany({
      where: { usuarioId: userId },
      select: { proyectoId: true }
    });
    proyectoIds = supervisorProyectos.map(sp => sp.proyectoId);
  }

  // Armadores con ubicación activa
  const armadores = await prisma.armador.findMany({
    where: {
      ubicacionActualLat: { not: null },
      ubicacionActualLng: { not: null },
      estado: 'ACTIVO'
    },
    include: {
      usuario: {
        select: {
          nombre: true,
          email: true
        }
      }
    }
  });

  // Proyectos disponibles para filtros (filtrados por rol)
  const proyectos = await prisma.proyecto.findMany({
    where: proyectoIds ? { id: { in: proyectoIds } } : undefined,
    select: {
      id: true,
      nombreComercial: true
    },
    orderBy: {
      nombreComercial: 'asc'
    }
  });

  // Órdenes activas con ubicación del cliente (filtradas por proyecto si es supervisor)
  const ordenes = await prisma.orden.findMany({
    where: {
      estado: {
        in: ['ASIGNADO', 'EN_RUTA', 'ARMADO_INICIADO']
      },
      ...(proyectoIds ? { proyectoId: { in: proyectoIds } } : {})
    },
    include: {
      usuarioFinal: {
        select: {
          nombre: true,
          direccionCompleta: true,
          municipio: true,
          coordenadasLat: true,
          coordenadasLng: true
        }
      },
      armador: {
        include: {
          usuario: {
            select: {
              nombre: true
            }
          }
        }
      },
      proyecto: {
        select: {
          nombreComercial: true
        }
      }
    }
  });

  return { armadores, ordenes, proyectos };
}

export default async function MapaPage() {
  try {
  const session = await getSession();

  if (!session || !["ADMIN", "SUPERVISOR"].includes(session.rol)) {
    redirect("/login");
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.userId },
  });

  if (!usuario) {
    redirect("/login");
  }

  const { armadores, ordenes, proyectos } = await getMapData(session.userId, session.rol);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={usuario} />

      <main className="container mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-deep-navy">
            Mapa de Operaciones
          </h1>
          <p className="text-gray-600 mt-2">
            Visualiza armadores y órdenes en tiempo real, filtrando por proyecto y estado.
          </p>
        </div>

        {/* Filtros por Proyecto */}
        <MapaFilters proyectos={proyectos} />

        <MapaDashboard
          armadores={armadores.map((a: any) => ({
            id: a.id,
            nombre: a.usuario.nombre,
            lat: a.ubicacionActualLat!,
            lng: a.ubicacionActualLng!,
            estado: a.estado,
          }))}
          ordenes={ordenes
            .filter((o: any) => o.usuarioFinal.coordenadasLat && o.usuarioFinal.coordenadasLng)
            .map((o: any) => ({
              id: o.id,
              codigoReferenciaRetail: o.codigoReferenciaRetail,
              estado: o.estado,
              lat: o.usuarioFinal.coordenadasLat!,
              lng: o.usuarioFinal.coordenadasLng!,
              direccion: o.usuarioFinal.direccionCompleta,
              municipio: o.usuarioFinal.municipio,
              armadorNombre: o.armador?.usuario.nombre || "Sin asignar",
              proyectoId: o.proyectoId,
              proyectoNombre: o.proyecto.nombreComercial,
            }))}
        />
      </main>
    </div>
  );
  } catch (error) {
    console.error("Error en Mapa:", error);
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <div className="text-center p-8">
          <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error en Mapa</h1>
          <p className="text-gray-600 mb-4">Ha ocurrido un error al cargar el mapa de operaciones.</p>
          <p className="text-sm text-gray-500 mb-6">
            {error instanceof Error ? error.message : "Error desconocido"}
          </p>
          <Link href="/admin">
            <EnhancedButton>
              Volver al Dashboard
            </EnhancedButton>
          </Link>
        </div>
      </div>
    );
  }
}
