import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { ProjectBillingManager } from "@/components/project-billing-manager";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PageProps {
  params: Promise<{ id: string }>;
}

type DatosFacturacion = {
  razonSocial?: string;
  nit?: string;
  nrc?: string;
  giro?: string;
  nombreCompleto?: string;
  dui?: string;
  direccion?: string;
  contacto?: {
    nombre?: string;
    email?: string;
    telefono?: string;
  };
};

export default async function ProyectoDetallePage({ params }: PageProps) {
  const { id } = await params;
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

  const proyecto = await prisma.proyecto.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          ordenes: true,
          muebles: true,
          usuariosFinales: true,
        },
      },
      muebles: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      usuariosFinales: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      reglaCobro: {
        include: {
          rangosVolumen: true,
          cobrosDistancia: true,
          penalizaciones: true,
        },
      },
    },
  });

  if (!proyecto) {
    notFound();
  }

  const reglaCobroInicial = proyecto.reglaCobro
    ? {
        id: proyecto.reglaCobro.id,
        tipoPrincipal: proyecto.reglaCobro.tipoPrincipal,
        precioFijoUnitario: proyecto.reglaCobro.precioFijoUnitario ?? null,
        precioVIP: proyecto.reglaCobro.precioVIP,
        precioUrgente: proyecto.reglaCobro.precioUrgente,
        precioMedia: proyecto.reglaCobro.precioMedia,
        precioNormal: proyecto.reglaCobro.precioNormal,
        precioGrande: proyecto.reglaCobro.precioGrande,
        precioMediano: proyecto.reglaCobro.precioMediano,
        precioPequeno: proyecto.reglaCobro.precioPequeno,
        rangosVolumen: proyecto.reglaCobro.rangosVolumen.map((rango) => ({
          id: rango.id,
          desde: rango.desde,
          hasta: rango.hasta,
          precio: rango.precio,
        })),
        cobrosDistancia: proyecto.reglaCobro.cobrosDistancia.map((cobro) => ({
          id: cobro.id,
          municipio: cobro.municipio,
          precio: cobro.precio,
        })),
        penalizaciones: proyecto.reglaCobro.penalizaciones.map((penalizacion) => ({
          id: penalizacion.id,
          tipo: penalizacion.tipo,
          precio: penalizacion.precio,
        })),
      }
    : null;

  const datosFacturacion = proyecto.datosFacturacion as DatosFacturacion;
  const esCreditoFiscal = proyecto.tipoCliente === "CREDITO_FISCAL";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={usuario} />

      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-deep-navy">
              {proyecto.nombreComercial}
            </h1>
            <p className="text-gray-600 mt-2">
              Detalles del proyecto y datos asociados.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={proyecto.activo ? "success" : "destructive"}>
              {proyecto.activo ? "Activo" : "Inactivo"}
            </Badge>
            <Badge variant="outline">
              {esCreditoFiscal ? "Crédito Fiscal" : "Consumidor Final"}
            </Badge>
            <Link href="/admin/proyectos">
              <Button variant="outline" size="sm">
                ← Volver a Proyectos
              </Button>
            </Link>
          </div>
        </div>

        <section className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Datos de facturación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-700">
              {esCreditoFiscal ? (
                <>
                  <div>
                    <p className="font-semibold text-gray-900">Razón social</p>
                    <p>{datosFacturacion.razonSocial ?? "—"}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="font-semibold text-gray-900">NIT</p>
                      <p>{datosFacturacion.nit ?? "—"}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">NRC</p>
                      <p>{datosFacturacion.nrc ?? "—"}</p>
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Giro</p>
                    <p>{datosFacturacion.giro ?? "—"}</p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="font-semibold text-gray-900">Nombre completo</p>
                    <p>{datosFacturacion.nombreCompleto ?? "—"}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">DUI</p>
                    <p>{datosFacturacion.dui ?? "—"}</p>
                  </div>
                </>
              )}
              <div>
                <p className="font-semibold text-gray-900">Dirección</p>
                <p>{datosFacturacion.direccion ?? "—"}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="font-semibold text-gray-900">Contacto</p>
                  <p>{datosFacturacion.contacto?.nombre ?? "—"}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Teléfono</p>
                  <p>{datosFacturacion.contacto?.telefono ?? "—"}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Correo</p>
                  <p>{datosFacturacion.contacto?.email ?? "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumen general</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-gray-700">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">Órdenes</span>
                <span>{proyecto._count.ordenes}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">Muebles</span>
                <span>{proyecto._count.muebles}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">Clientes finales</span>
                <span>{proyecto._count.usuariosFinales}</span>
              </div>
              {proyecto.reglaCobro ? (
                <div className="pt-2 border-t border-gray-200 space-y-2">
                  <p className="font-semibold text-gray-900">Regla de cobro</p>
                  <p className="text-sm text-gray-600">
                    Tipo principal: {proyecto.reglaCobro.tipoPrincipal.replace(/_/g, " ")}
                  </p>
                  {proyecto.reglaCobro.precioFijoUnitario && (
                    <p className="text-sm text-gray-600">
                      Precio fijo unitario: ${proyecto.reglaCobro.precioFijoUnitario.toFixed(2)}
                    </p>
                  )}
                </div>
              ) : (
                <p className="pt-2 border-t border-gray-200 text-sm text-gray-600">
                  No hay regla de cobro configurada.
                </p>
              )}
            </CardContent>
          </Card>
        </section>

        <section>
          <ProjectBillingManager projectId={proyecto.id} initialRule={reglaCobroInicial} />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Muebles recientes</CardTitle>
            </CardHeader>
            <CardContent>
              {proyecto.muebles.length === 0 ? (
                <p className="text-sm text-gray-600">
                  No hay muebles registrados para este proyecto.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Tamaño</TableHead>
                      <TableHead>Descripción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {proyecto.muebles.map((mueble) => (
                      <TableRow key={mueble.id}>
                        <TableCell className="font-medium">{mueble.nombre}</TableCell>
                        <TableCell>{mueble.tamano.replace(/_/g, " ")}</TableCell>
                        <TableCell>{mueble.descripcion ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Clientes finales recientes</CardTitle>
            </CardHeader>
            <CardContent>
              {proyecto.usuariosFinales.length === 0 ? (
                <p className="text-sm text-gray-600">
                  No hay clientes finales asociados todavía.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Municipio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {proyecto.usuariosFinales.map((cliente) => (
                      <TableRow key={cliente.id}>
                        <TableCell className="font-medium">{cliente.nombre}</TableCell>
                        <TableCell>{cliente.telefono}</TableCell>
                        <TableCell>{cliente.municipio}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
