import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { Label } from "@/components/ui/label";
import MapaDashboard from "@/components/mapa-dashboard";
import { Filter, MapPin, AlertTriangle } from "lucide-react";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import Link from "next/link";

type Usuario = {
  nombre: string;
  email: string;
  rol: "ADMIN" | "SUPERVISOR" | "ARMADOR";
};

async function getMapData() {
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

  // Proyectos disponibles para filtros
  const proyectos = await prisma.proyecto.findMany({
    select: {
      id: true,
      nombreComercial: true
    },
    orderBy: {
      nombreComercial: 'asc'
    }
  });

  // Órdenes activas con ubicación del cliente
  const ordenes = await prisma.orden.findMany({
    where: {
      estado: {
        in: ['ASIGNADO', 'EN_RUTA', 'ARMADO_INICIADO']
      }
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

  const { armadores, ordenes, proyectos } = await getMapData();

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
        <EnhancedCard className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center mb-4">
            <Filter className="w-5 h-5 mr-2 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 tracking-tight">Filtros del Mapa</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="proyecto-filter" className="text-sm font-medium text-gray-700 tracking-wide">
                Filtrar por Proyecto
              </Label>
              <select 
                id="proyecto-filter"
                className="w-full mt-1 rounded-lg border border-input bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                onChange={(e) => {
                  // Filtrar elementos en el mapa
                  const event = new CustomEvent('filterByProject', { detail: e.target.value });
                  window.dispatchEvent(event);
                }}
              >
                <option value="ALL">Todos los proyectos</option>
                {proyectos.map((proyecto) => (
                  <option key={proyecto.id} value={proyecto.id}>
                    {proyecto.nombreComercial}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estado-filter" className="text-sm font-medium text-gray-700 tracking-wide">
                Filtrar por Estado
              </Label>
              <select 
                id="estado-filter"
                className="w-full mt-1 rounded-lg border border-input bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                onChange={(e) => {
                  const event = new CustomEvent('filterByEstado', { detail: e.target.value });
                  window.dispatchEvent(event);
                }}
              >
                <option value="ALL">Todos los estados</option>
                <option value="ACTIVO">Armadores Activos</option>
                <option value="ASIGNADO">Órdenes Asignadas</option>
                <option value="EN_RUTA">Órdenes en Ruta</option>
                <option value="ARMADO_INICIADO">Armado Iniciado</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 tracking-wide">
                Estadísticas Rápidas
              </Label>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-700">Armadores Activos</span>
                </div>
                <span className="text-lg font-semibold text-gray-900 tracking-tight">{armadores.length}</span>
              </div>
            </div>
          </div>
        </EnhancedCard>

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
