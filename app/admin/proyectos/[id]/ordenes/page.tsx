import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  ArrowLeft,
  Calendar,
  Package,
  User,
  BadgeCheck,
  Clock,
  XCircle
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProyectoOrdenesPage({ params }: PageProps) {
  const session = await getSession();
  const resolvedParams = await params;

  if (!session || !["ADMIN", "SUPERVISOR"].includes(session.rol)) {
    redirect("/login");
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.userId },
  });

  if (!usuario) {
    redirect("/login");
  }

  // Obtener el proyecto
  const proyecto = await prisma.proyecto.findUnique({
    where: { id: resolvedParams.id },
    include: {
      _count: {
        select: { ordenes: true }
      }
    }
  });

  if (!proyecto) {
    redirect("/admin/proyectos");
  }

  // Obtener las órdenes del proyecto
  const ordenes = await prisma.orden.findMany({
    where: { proyectoId: resolvedParams.id },
    include: {
      armador: {
        include: {
          usuario: {
            select: { nombre: true }
          }
        }
      },
      usuarioFinal: {
        select: { nombre: true }
      }
    },
    orderBy: { fechaCreacion: 'desc' },
    take: 100
  });

  const getEstadoBadge = (estado: string) => {
    const badges = {
      'ARMADO_COMPLETADO': { color: 'bg-green-100 text-green-800', icon: BadgeCheck, text: 'Completado' },
      'EN_ARMADO': { color: 'bg-blue-100 text-blue-800', icon: Package, text: 'En Armado' },
      'PENDIENTE': { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Pendiente' },
      'CANCELADA': { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Cancelada' },
    };
    
    const badge = badges[estado as keyof typeof badges] || badges['PENDIENTE'];
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {badge.text}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <Navbar user={usuario} />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Link href="/admin/proyectos">
                <EnhancedButton variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </EnhancedButton>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gradient mb-2">
                  Órdenes de {proyecto.nombreComercial}
                </h1>
                <p className="text-muted-foreground">
                  {ordenes.length} órdenes en total
                </p>
              </div>
            </div>
            <Link href="/admin/ordenes/crear">
              <EnhancedButton variant="default" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <FileText className="w-4 h-4 mr-2" />
                Nueva Orden
              </EnhancedButton>
            </Link>
          </div>
        </div>

        {/* Tabla de Órdenes */}
        <EnhancedCard>
          {ordenes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No hay órdenes
              </h3>
              <p className="text-gray-600 mb-6">
                Este proyecto aún no tiene órdenes registradas.
              </p>
              <Link href="/admin/ordenes/crear">
                <EnhancedButton variant="default" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <FileText className="w-4 h-4 mr-2" />
                  Crear Primera Orden
                </EnhancedButton>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Armador</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha Creación</TableHead>
                    <TableHead>Fecha Entrega</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordenes.map((orden) => (
                    <TableRow key={orden.id}>
                      <TableCell className="font-medium">
                        {orden.codigoReferenciaRetail}
                      </TableCell>
                      <TableCell>{orden.usuarioFinal?.nombre || 'Sin cliente'}</TableCell>
                      <TableCell>
                        {orden.armador?.usuario.nombre || 'Sin asignar'}
                      </TableCell>
                      <TableCell>
                        {getEstadoBadge(orden.estado)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-1" />
                          {orden.fechaCreacion.toLocaleDateString('es-ES')}
                        </div>
                      </TableCell>
                      <TableCell>
                        {orden.fechaCompletado ? (
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="w-4 h-4 mr-1" />
                            {orden.fechaCompletado.toLocaleDateString('es-ES')}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Pendiente</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/ordenes/${orden.id}`}>
                          <EnhancedButton variant="outline" size="sm">
                            Ver Detalles
                          </EnhancedButton>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </EnhancedCard>
      </main>
    </div>
  );
}
