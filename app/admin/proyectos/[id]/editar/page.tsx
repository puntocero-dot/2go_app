import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Building, Save, X } from "lucide-react";
import { ProyectoEditForm } from "@/components/proyectos/proyecto-edit-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditarProyectoPage({ params }: PageProps) {
  const session = await getSession();
  const resolvedParams = await params;

  if (!session || !["ADMIN"].includes(session.rol)) {
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
      muebles: {
        orderBy: { nombre: 'asc' }
      },
      _count: {
        select: { 
          ordenes: true,
          usuariosFinales: true,
          muebles: true
        }
      }
    }
  });

  if (!proyecto) {
    redirect("/admin/proyectos");
  }

  // Obtener el estado por separado si no viene en la consulta
  const proyectoConEstado = await prisma.proyecto.findUnique({
    where: { id: resolvedParams.id },
    select: { activo: true }
  });

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
                  Editar Proyecto
                </h1>
                <p className="text-muted-foreground">
                  Modifica la información del proyecto "{proyecto.nombreComercial}"
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link href={`/admin/proyectos/${proyecto.id}`}>
                <EnhancedButton variant="outline">
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </EnhancedButton>
              </Link>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <EnhancedCard className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-blue-100 rounded-xl shadow-sm">
                <Building className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 tracking-wide mb-1">Nombre Comercial</p>
                <p className="text-lg font-semibold text-gray-900 tracking-tight">{proyecto.nombreComercial}</p>
              </div>
            </div>
          </EnhancedCard>
          
          <EnhancedCard className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-green-100 rounded-xl shadow-sm">
                <Save className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Estado</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">
                  {proyectoConEstado?.activo ? 'Activo' : 'Inactivo'}
                </p>
              </div>
            </div>
          </EnhancedCard>
          
          <EnhancedCard className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-purple-100 rounded-xl shadow-sm">
                <Building className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 tracking-wide mb-1">Total Órdenes</p>
                <p className="text-lg font-semibold text-gray-900 tracking-tight">{proyecto._count.ordenes}</p>
              </div>
            </div>
          </EnhancedCard>
        </div>

        {/* Formulario de Edición */}
        <EnhancedCard className="p-8 bg-white rounded-xl border border-gray-200 shadow-sm">
          <ProyectoEditForm proyecto={proyecto} />
        </EnhancedCard>
      </main>
    </div>
  );
}
