import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { Badge } from "@/components/ui/badge";
import { EmptyProjects } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import {
  Package,
  Plus,
  FileText,
  Users,
  Building,
  Calendar
} from "lucide-react";

function ProjectCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  color = "primary" 
}: {
  title: string;
  value: string | number;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  color?: "primary" | "secondary" | "success" | "warning" | "info";
}) {
  const colorClasses = {
    primary: "text-madera-natural bg-madera-natural/10",
    secondary: "text-terracota bg-terracota/10",
    success: "text-green-600 bg-green-100",
    warning: "text-yellow-600 bg-yellow-100",
    info: "text-blue-600 bg-blue-100",
  };

  return (
    <EnhancedCard hover className="relative overflow-hidden p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="absolute top-0 right-0 -mt-4 -mr-4 opacity-10">
        <Icon className="w-20 h-20" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center mb-6">
          <div className={`p-4 rounded-xl ${colorClasses[color]} shadow-sm`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
        <h3 className="text-3xl font-bold text-foreground mb-2 tracking-tight">
          {value}
        </h3>
        <p className="text-sm text-muted-foreground font-medium tracking-wide">
          {title}
        </p>
        <p className="text-xs text-muted-foreground mt-1 tracking-wide">
          {description}
        </p>
      </div>
    </EnhancedCard>
  );
}

export default async function ProyectosPage() {
  const session = await getSession();

  if (!session || session.rol !== "ADMIN") {
    redirect("/login");
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.userId },
  });

  if (!usuario) {
    redirect("/login");
  }

  const proyectos = await prisma.proyecto.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          ordenes: true,
          muebles: true,
          usuariosFinales: true,
        },
      },
    },
  });

  const totalStats = {
    proyectos: proyectos.length,
    ordenes: proyectos.reduce((sum, p) => sum + p._count.ordenes, 0),
    muebles: proyectos.reduce((sum, p) => sum + p._count.muebles, 0),
    clientes: proyectos.reduce((sum, p) => sum + p._count.usuariosFinales, 0),
  };

  const hasProjects = proyectos.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <Navbar user={usuario} />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gradient mb-2">
                Gestión de Proyectos
              </h1>
              <p className="text-muted-foreground text-lg">
                Administra todos los proyectos y sus configuraciones.
              </p>
            </div>
            <Link href="/admin/proyectos/crear">
              <EnhancedButton variant="default" className="min-w-[160px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Proyecto
              </EnhancedButton>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <ProjectCard
            title="Proyectos Totales"
            value={totalStats.proyectos}
            description="Activos en el sistema"
            icon={Building}
            color="primary"
          />
          <ProjectCard
            title="Órdenes Totales"
            value={totalStats.ordenes}
            description="Todos los proyectos"
            icon={FileText}
            color="secondary"
          />
          <ProjectCard
            title="Muebles Configurados"
            value={totalStats.muebles}
            description="En catálogo"
            icon={Package}
            color="info"
          />
          <ProjectCard
            title="Clientes Registrados"
            value={totalStats.clientes}
            description="Usuarios finales"
            icon={Users}
            color="success"
          />
        </section>

        {/* Tabla de Proyectos o Empty State */}
        <section className="fade-in-up">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-foreground flex items-center">
              <Building className="w-6 h-6 mr-2 text-primary" />
              Todos los Proyectos
              {hasProjects && (
                <Badge variant="outline" className="ml-3">
                  {proyectos.length} proyectos
                </Badge>
              )}
            </h2>
            {hasProjects && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  Ordenados por fecha de creación
                </span>
              </div>
            )}
          </div>

          {hasProjects ? (
            <EnhancedCard hover>
              <div className="rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Proyecto</TableHead>
                      <TableHead className="font-semibold">Nombre Comercial</TableHead>
                      <TableHead className="font-semibold">Órdenes</TableHead>
                      <TableHead className="font-semibold">Muebles</TableHead>
                      <TableHead className="font-semibold">Clientes</TableHead>
                      <TableHead className="font-semibold">Creado</TableHead>
                      <TableHead className="font-semibold text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {proyectos.map((proyecto, index) => (
                      <TableRow 
                        key={proyecto.id}
                        className="hover:bg-muted/30 transition-colors cursor-pointer"
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <Building className="w-4 h-4 mr-2 text-muted-foreground" />
                            <span className="mr-2 text-muted-foreground">#{index + 1}</span>
                            {proyecto.nombreComercial}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Package className="w-4 h-4 mr-2 text-muted-foreground" />
                            {proyecto.nombreComercial}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            <FileText className="w-3 h-3 mr-1" />
                            {proyecto._count.ordenes}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            <Package className="w-3 h-3 mr-1" />
                            {proyecto._count.muebles}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-purple-50 text-purple-700">
                            <Users className="w-3 h-3 mr-1" />
                            {proyecto._count.usuariosFinales}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-muted-foreground">
                            <Calendar className="w-4 h-4 mr-2" />
                            {proyecto.createdAt.toLocaleDateString("es-ES", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Link href={`/admin/proyectos/${proyecto.id}/ordenes`}>
                              <EnhancedButton variant="outline" size="sm">
                                <FileText className="w-4 h-4 mr-1" />
                                Ver Órdenes
                              </EnhancedButton>
                            </Link>
                            <Link href={`/admin/proyectos/${proyecto.id}/editar`}>
                              <EnhancedButton variant="ghost" size="sm">
                                Editar
                              </EnhancedButton>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </EnhancedCard>
          ) : (
            <EmptyProjects href="/admin/proyectos/crear" />
          )}
        </section>
      </main>
    </div>
  );
}
