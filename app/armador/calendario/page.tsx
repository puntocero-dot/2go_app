import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { ArmadorCalendario } from "@/components/armador-calendario";

export const dynamic = "force-dynamic";

export default async function CalendarioArmadorPage() {
  const session = await getSession();

  if (!session || session.rol !== "ARMADOR") {
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
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gradient mb-2">
            Mi Calendario
          </h1>
          <p className="text-muted-foreground">
            Visualiza tus órdenes asignadas por fecha
          </p>
        </div>

        <ArmadorCalendario />
      </main>
    </div>
  );
}
