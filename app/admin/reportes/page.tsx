import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { ReportesClient } from "@/components/reportes-client";

export const dynamic = "force-dynamic";

export default async function ReportesPage() {
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

  // Obtener lista de proyectos para filtros
  const proyectos = await prisma.proyecto.findMany({
    where: { activo: true },
    select: { id: true, nombreComercial: true },
    orderBy: { nombreComercial: "asc" },
  });

  // Obtener lista de armadores para filtros
  const armadores = await prisma.armador.findMany({
    include: { usuario: { select: { nombre: true } } },
    orderBy: { usuario: { nombre: "asc" } },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <Navbar user={usuario} />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gradient mb-2">Reportes</h1>
          <p className="text-muted-foreground">
            Genera reportes personalizados con tablas dinámicas tipo pivot
          </p>
        </div>

        <ReportesClient
          proyectos={proyectos}
          armadores={armadores.map((a) => ({
            id: a.id,
            nombre: a.usuario.nombre,
          }))}
        />
      </main>
    </div>
  );
}
