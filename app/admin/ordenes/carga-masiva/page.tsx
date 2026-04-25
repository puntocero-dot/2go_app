import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { OrdersBulkUpload } from "@/components/orders-bulk-upload";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function CargaMasivaOrdenesPage() {
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

  return (
    <div className="min-h-screen">
      <Navbar user={usuario} />
      <main className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-gray-500">Carga masiva</p>
            <h1 className="text-3xl font-bold text-gradient">
              Carga masiva de órdenes
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-600">
              Sube un archivo CSV con el formato indicado para crear muchas órdenes de una sola vez.
              Cuando sea posible, se intentará auto-asignar armadores disponibles.
            </p>
          </div>
          <Link href="/admin/ordenes">
            <Button variant="outline" size="sm">
              ← Volver al listado
            </Button>
          </Link>
        </div>

        <OrdersBulkUpload />
      </main>
    </div>
  );
}
