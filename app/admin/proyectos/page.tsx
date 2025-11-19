import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={usuario} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-deep-navy">Proyectos</h1>
            <p className="text-gray-600 mt-2">
              Gestiona los proyectos y clientes retail
            </p>
          </div>
          <Link href="/admin/proyectos/nuevo">
            <Button className="bg-vibrant-cyan hover:bg-vibrant-cyan/90">
              + Nuevo Proyecto
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Todos los Proyectos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre Comercial</TableHead>
                  <TableHead>Tipo de Cliente</TableHead>
                  <TableHead>Órdenes</TableHead>
                  <TableHead>Muebles</TableHead>
                  <TableHead>Clientes</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proyectos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No hay proyectos registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  proyectos.map((proyecto) => (
                    <TableRow key={proyecto.id}>
                      <TableCell className="text-sm font-medium">
                        {proyecto.nombreComercial}
                      </TableCell>
                      <TableCell className="text-sm">
                        <Badge variant="outline">
                          {proyecto.tipoCliente === "CREDITO_FISCAL" 
                            ? "Crédito Fiscal" 
                            : "Consumidor Final"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{proyecto._count.ordenes}</TableCell>
                      <TableCell className="text-sm">{proyecto._count.muebles}</TableCell>
                      <TableCell className="text-sm">{proyecto._count.usuariosFinales}</TableCell>
                      <TableCell className="text-sm">
                        <Badge variant={proyecto.activo ? "success" : "destructive"}>
                          {proyecto.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        <Link href={`/admin/proyectos/${proyecto.id}`}>
                          <Button variant="outline" size="sm">
                            Ver Detalles
                          </Button>
                        </Link>
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