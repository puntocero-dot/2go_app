import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { AdminUsersManager } from "@/components/admin-users-manager";

export default async function AdminUsuariosPage() {
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

  const usuarios = await prisma.usuario.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      armador: {
        include: {
          ordenes: {
            where: {
              estado: {
                in: ["ASIGNADO", "EN_RUTA", "ARMADO_INICIADO"],
              },
            },
            select: { id: true },
          },
        },
      },
    },
  });

  const serializableUsuarios = usuarios.map((usuario) => ({
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    telefono: usuario.telefono,
    rol: usuario.rol,
    activo: usuario.activo,
    createdAt: usuario.createdAt.toISOString(),
    armador: usuario.armador
      ? {
          id: usuario.armador.id,
          estado: usuario.armador.estado,
          habilidades: usuario.armador.habilidades,
          ordenesActivas: usuario.armador.ordenes.length,
        }
      : null,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={usuario} />

      <main className="container mx-auto px-4 py-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-deep-navy">Usuarios del sistema</h1>
          <p className="text-gray-600 max-w-3xl">
            Crea y administra cuentas de administradores, supervisores y armadores. Los armadores creados aquí podrán ingresar con su rol y participar en la asignación automática.
          </p>
        </div>

        <AdminUsersManager initialUsers={serializableUsuarios} />
      </main>
    </div>
  );
}
