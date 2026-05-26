import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { Users, Package, DollarSign } from "lucide-react";
import Link from "next/link";

export default async function AdminAdministracionPage() {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <Navbar user={usuario} />

      <main className="container mx-auto px-4 py-8 space-y-8">
        <header className="fade-in">
          <h1 className="text-4xl font-bold text-gradient mb-2">Centro de Administración</h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Accede a la configuración de usuarios, proyectos y facturación del sistema.
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 fade-in-up">
          <EnhancedCard hover className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-3 rounded-lg bg-blue-50 text-blue-700">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Usuarios</h2>
                <p className="text-sm text-muted-foreground">
                  Administra cuentas de administradores, supervisores y armadores.
                </p>
              </div>
            </div>
            <Link href="/admin/usuarios">
              <EnhancedButton className="w-full" variant="default">
                Ir a Usuarios
              </EnhancedButton>
            </Link>
          </EnhancedCard>

          <EnhancedCard hover className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-3 rounded-lg bg-emerald-50 text-emerald-700">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Proyectos</h2>
                <p className="text-sm text-muted-foreground">
                  Configura proyectos, catálogos y clientes finales.
                </p>
              </div>
            </div>
            <Link href="/admin/proyectos">
              <EnhancedButton className="w-full" variant="default">
                Ir a Proyectos
              </EnhancedButton>
            </Link>
          </EnhancedCard>

          <EnhancedCard hover className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-3 rounded-lg bg-amber-50 text-amber-700">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Facturación</h2>
                <p className="text-sm text-muted-foreground">
                  Define reglas de cobro, datos fiscales y plantillas de factura.
                </p>
              </div>
            </div>
            <Link href="/admin/facturacion">
              <EnhancedButton className="w-full" variant="default">
                Ir a Facturación
              </EnhancedButton>
            </Link>
          </EnhancedCard>
        </section>
      </main>
    </div>
  );
}
