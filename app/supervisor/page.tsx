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
      <div className="min-h-screen">
        <Navbar user={usuario} />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-white/[0.06] rounded-2xl flex items-center justify-center mx-auto mb-5 border border-white/10">
              <span className="text-3xl">📋</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">
              No tienes proyectos asignados
            </h1>
            <p className="text-white/50">
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
    <div className="min-h-screen">
      <Navbar user={usuario} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 fade-in">
          <h1 className="text-3xl font-bold text-gradient mb-2">Dashboard Supervisor</h1>
          <p className="text-white/50">
            Gestión de órdenes y asignaciones
          </p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <Card glass hover>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/70">Órdenes Hoy</CardTitle>
              <div className="w-9 h-9 rounded-xl bg-cyan-500/15 flex items-center justify-center">
                <span className="text-base">📅</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{ordenesHoy}</div>
              <p className="text-xs text-white/40 mt-1">Creadas hoy</p>
            </CardContent>
          </Card>

          <Card glass hover>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/70">Órdenes Activas</CardTitle>
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
                <span className="text-base">⚡</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{ordenesActivas}</div>
              <p className="text-xs text-white/40 mt-1">En proceso</p>
            </CardContent>
          </Card>

          <Card glass hover>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/70">Total Órdenes</CardTitle>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                <span className="text-base">📦</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{ordenes.length}</div>
              <p className="text-xs text-white/40 mt-1">Registradas</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Órdenes */}
        <Card glass>
          <CardHeader>
            <CardTitle className="text-white">Todas las Órdenes</CardTitle>
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