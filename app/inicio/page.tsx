import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

// Forzar que esta página siempre se resuelva por-request, usando las cookies actuales
export const dynamic = "force-dynamic";

export default async function InicioPorRolPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  switch (session.rol) {
    case "ADMIN":
      redirect("/admin");
    case "SUPERVISOR":
      redirect("/supervisor");
    case "ARMADOR":
      redirect("/armador");
    default:
      redirect("/login");
  }
}
