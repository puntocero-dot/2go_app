import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = 'force-dynamic';

export default async function SupervisorDashboard() {
  const session = await getSession();

  if (!session || session.rol !== "SUPERVISOR") {
    redirect("/login");
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.userId },
  });

  if (!usuario) {
    redirect("/login");
  }

  // Obtener proyectos asignados al supervisor
  const supervisorProyectos = await prisma.supervisorProyecto.findMany({
    where: { usuarioId: session.userId },
    select: { proyectoId: true },
  });

  const proyectoIds = supervisorProyectos.map(sp => sp.proyectoId);

  // Si no tiene proyectos asignados, mostrar mensaje
  if (proyectoIds.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={usuario} />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              No tienes proyectos asignados
            </h1>
            <p className="text-gray-600">
              Contacta al administrador para que te asigne proyectos.
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Obtener órdenes del día (solo de proyectos asignados)
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const [ordenesHoy, ordenesActivas, ordenes] = await Promise.all([
    prisma.orden.count({
      where: {
        proyectoId: { in: proyectoIds },
        createdAt: {
          gte: hoy,
        },
      },
    }),
    prisma.orden.count({
      where: {
        proyectoId: { in: proyectoIds },
        estado: {
          in: ["SIN_ASIGNAR", "ASIGNADO", "EN_RUTA", "ARMADO_INICIADO"],
        },
      },
    }),
    prisma.orden.findMany({
      where: {
        proyectoId: { in: proyectoIds },
      },
      take: 20,
      orderBy: { createdAt: "desc" },
      include: {
        proyecto: {
          select: {
            nombreComercial: true,
          },
        },
        usuarioFinal: {
          select: {
            direccionCompleta: true,
          },
        },
        armador: {
          include: {
            usuario: true,
          },
        },
      },
    }),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={usuario} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-deep-navy">Dashboard Supervisor</h1>
          <p className="text-gray-600 mt-2">
            Gestión de órdenes y asignaciones
          </p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Órdenes Hoy
              </CardTitle>
              <div className="text-2xl">📅</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ordenesHoy}</div>
              <p className="text-xs text-muted-foreground">
                Creadas hoy
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Órdenes Activas
              </CardTitle>
              <div className="text-2xl">⚡</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ordenesActivas}</div>
              <p className="text-xs text-muted-foreground">
                En proceso
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Órdenes
              </CardTitle>
              <div className="text-2xl">📦</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ordenes.length}</div>
              <p className="text-xs text-muted-foreground">
                Registradas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Órdenes */}
        <Card>
          <CardHeader>
            <CardTitle>Todas las Órdenes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Proyecto</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Armador</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordenes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No hay órdenes registradas
                    </TableCell>
                  </TableRow>
                ) : (
                  ordenes.map((orden) => (
                    <TableRow key={orden.id}>
                      <TableCell className="font-mono text-xs">
                        {orden.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>{orden.proyecto.nombreComercial}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {orden.usuarioFinal?.direccionCompleta ?? ""}
                      </TableCell>
                      <TableCell>
                        {orden.armador?.usuario.nombre || "Sin asignar"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            orden.estado === "ARMADO_COMPLETADO"
                              ? "success"
                              : orden.estado === "ARMADO_FINALIZADO"
                              ? "success"
                              : "warning"
                          }
                        >
                          {orden.estado.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(orden.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}