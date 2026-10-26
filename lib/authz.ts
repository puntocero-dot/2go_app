import { prisma } from "./prisma";

/**
 * Verifica que un SUPERVISOR efectivamente supervise el proyecto dado.
 * ADMIN siempre pasa (no tiene restricción de proyecto). Cualquier otro
 * rol (incluido SUPERVISOR sin asignación a ese proyecto) se rechaza.
 *
 * Centraliza un chequeo que varias rutas repetían de forma inconsistente
 * — algunas lo validaban, otras validaban solo el rol global y dejaban
 * que un SUPERVISOR operara sobre proyectos que no le pertenecen.
 */
export async function assertSupervisorScope(
  session: { userId: string; rol: string },
  proyectoId: string
): Promise<boolean> {
  if (session.rol === "ADMIN") return true;
  if (session.rol !== "SUPERVISOR") return false;

  const supervisorProyecto = await prisma.supervisorProyecto.findFirst({
    where: { usuarioId: session.userId, proyectoId },
  });
  return Boolean(supervisorProyecto);
}
