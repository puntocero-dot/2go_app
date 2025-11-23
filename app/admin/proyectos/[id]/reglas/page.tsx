import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ReglaCobroForm from '@/components/reglas-cobro-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

async function getProyectoConReglas(id: string) {
  const proyecto = await prisma.proyecto.findUnique({
    where: { id },
    include: {
      reglaCobro: {
        include: {
          rangosVolumen: true
        }
      }
    }
  });

  if (!proyecto) return null;
  return proyecto;
}

export default async function ReglasCobroPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const proyecto = await getProyectoConReglas(id);

  if (!proyecto) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reglas de Cobro</h1>
          <p className="text-muted-foreground">
            Proyecto: <strong>{proyecto.nombreComercial}</strong>
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/admin/proyectos/${proyecto.id}`}>
            ← Volver al Proyecto
          </Link>
        </Button>
      </div>

      {/* Card con info actual */}
      {proyecto.reglaCobro && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Regla Actual</CardTitle>
            <CardDescription>
              Configuración activa de facturación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium">Tipo: </span>
                <Badge>
                  {proyecto.reglaCobro.tipoPrincipal === 'COBRO_FIJO_UNITARIO' 
                    ? 'Cobro Fijo por Orden' 
                    : 'Cobro por Volumen'}
                </Badge>
              </div>

              {proyecto.reglaCobro.tipoPrincipal === 'COBRO_FIJO_UNITARIO' && (
                <div>
                  <span className="text-sm font-medium">Precio por Orden: </span>
                  <span className="text-lg font-bold">${proyecto.reglaCobro.precioFijoUnitario?.toFixed(2)}</span>
                </div>
              )}

              {proyecto.reglaCobro.tipoPrincipal === 'COBRO_POR_VOLUMEN' && (
                <div>
                  <span className="text-sm font-medium">Rangos de Volumen:</span>
                  <div className="mt-2 space-y-1">
                    {(proyecto.reglaCobro.rangosVolumen as any[])?.map((rango, i) => (
                      <div key={i} className="text-sm bg-muted p-2 rounded">
                        De {rango.desde} a {rango.hasta === null ? '∞' : rango.hasta} órdenes → ${rango.precio}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulario de edición */}
      <Card>
        <CardHeader>
          <CardTitle>{proyecto.reglaCobro ? 'Editar' : 'Crear'} Regla de Cobro</CardTitle>
          <CardDescription>
            Define cómo se calculará el monto a facturar a este proyecto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReglaCobroForm 
            proyectoId={proyecto.id}
            reglaActual={proyecto.reglaCobro}
          />
        </CardContent>
      </Card>
    </div>
  );
}