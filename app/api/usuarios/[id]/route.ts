import { NextRequest, NextResponse } from "next/server";
import { getSession, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  actualizarUsuarioSchema,
  rolesPermitidos,
  estadosArmadorPermitidos,
} from "@/lib/schemas/usuario.schema";

const ROLES_PERMITIDOS = rolesPermitidos;
type RolPermitido = (typeof ROLES_PERMITIDOS)[number];

const ESTADOS_ARMADOR = estadosArmadorPermitidos;
type EstadoArmadorPermitido = (typeof ESTADOS_ARMADOR)[number];

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getSession();

    if (!session || session.rol !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    // Validación de Origin para prevenir CSRF
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');

    // Lista de orígenes permitidos
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_APP_URL,
      process.env.NEXT_PUBLIC_PRODUCTION_URL,
      'http://localhost:3000',
      'http://localhost:3001',
    ].filter((value): value is string => typeof value === 'string' && value.length > 0);

    // Si hay origin, validarlo
    if (origin) {
      const isAllowed = allowedOrigins.some(allowed => origin.startsWith(allowed));
      if (!isAllowed) {
        console.warn(JSON.stringify({
          timestamp: new Date().toISOString(),
          tipo: 'CSRF_ATTEMPT_BLOCKED',
          origin,
          referer,
          endpoint: request.url,
          adminId: session.userId,
        }));
        return NextResponse.json(
          { error: 'Origin no permitido' },
          { status: 403 }
        );
      }
    }

    const { id: usuarioId } = await context.params;
    if (!usuarioId) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const rawBody = await request.json();
    const parsed = actualizarUsuarioSchema.safeParse(rawBody);

    if (!parsed.success) {
      const detalles = parsed.error.flatten();
      return NextResponse.json(
        { error: "Datos inválidos", detalles },
        { status: 400 }
      );
    }

    const { nombre, email, telefono, rol, estadoArmador, habilidades, activo, password } =
      parsed.data;

    const updateData: Record<string, unknown> = {};

    let hashedPassword: string | undefined;
    if (typeof password === "string" && password.trim().length > 0) {
      hashedPassword = await hashPassword(password.trim());
    }

    if (typeof nombre === "string" && nombre.trim().length > 0) {
      updateData.nombre = nombre.trim();
    }

    if (typeof email === "string") {
      const emailNormalizado = email.trim().toLowerCase();

      const usuarioExistente = await prisma.usuario.findFirst({
        where: {
          email: emailNormalizado,
          NOT: { id: usuarioId },
        },
        select: { id: true },
      });

      if (usuarioExistente) {
        return NextResponse.json(
          { error: "Ya existe un usuario con este correo" },
          { status: 409 }
        );
      }

      updateData.email = emailNormalizado;
    }

    if (typeof telefono === "string") {
      updateData.telefono = telefono.trim();
    } else if (telefono === null) {
      updateData.telefono = null;
    }

    if (typeof activo === "boolean") {
      updateData.activo = activo;
    }

    if (hashedPassword) {
      updateData.password = hashedPassword;
    }

    if (rol && ROLES_PERMITIDOS.includes(rol)) {
      updateData.rol = rol;
    }

    const usuarioActual = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      include: { armador: true },
    });

    if (!usuarioActual) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const adminActivosCount = await prisma.usuario.count({
      where: {
        rol: "ADMIN",
        activo: true,
      },
    });

    const esAdminActual = usuarioActual.rol === "ADMIN" && usuarioActual.activo === true;

    const cambiandoRolFueraDeAdmin = typeof rol === "string" && rol !== "ADMIN";

    const desactivandoUsuario = typeof activo === "boolean" && activo === false;

    if (
      esAdminActual &&
      adminActivosCount === 1 &&
      (cambiandoRolFueraDeAdmin || desactivandoUsuario)
    ) {
      return NextResponse.json(
        { error: "No puedes eliminar el último administrador" },
        { status: 400 }
      );
    }

    const updatedUsuario = await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.update({
        where: { id: usuarioId },
        data: updateData,
      });

      const nuevoRol = (updateData.rol as RolPermitido | undefined) ?? usuarioActual.rol;

      if (nuevoRol === "ARMADOR") {
        const estado: EstadoArmadorPermitido = estadoArmador && ESTADOS_ARMADOR.includes(estadoArmador)
          ? estadoArmador
          : usuarioActual.armador?.estado ?? "ACTIVO";

        const habilidadesProcesadas = Array.isArray(habilidades)
          ? habilidades
              .map((skill) => (typeof skill === "string" ? skill.trim() : ""))
              .filter((skill) => skill.length > 0)
          : typeof habilidades === "string"
          ? habilidades
              .split(",")
              .map((skill) => skill.trim())
              .filter((skill) => skill.length > 0)
          : usuarioActual.armador?.habilidades ?? [];

        await tx.armador.upsert({
          where: { usuarioId: usuarioId },
          create: {
            usuarioId: usuarioId,
            estado,
            habilidades: habilidadesProcesadas,
          },
          update: {
            estado,
            habilidades: habilidadesProcesadas,
          },
        });
      } else if (usuarioActual.armador) {
        await tx.armador.delete({ where: { usuarioId } });
      }

      return usuario;
    });

    const usuarioConRelacion = await prisma.usuario.findUnique({
      where: { id: updatedUsuario.id },
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

    if (!usuarioConRelacion) {
      throw new Error("No se pudo recuperar el usuario actualizado");
    }

    const camposModificados: Record<string, { antes: unknown; despues: unknown }> = {};

    if ("nombre" in updateData) {
      camposModificados.nombre = {
        antes: usuarioActual.nombre,
        despues: (updateData as any).nombre,
      };
    }

    if ("email" in updateData) {
      camposModificados.email = {
        antes: usuarioActual.email,
        despues: (updateData as any).email,
      };
    }

    if ("telefono" in updateData) {
      camposModificados.telefono = {
        antes: usuarioActual.telefono,
        despues: (updateData as any).telefono,
      };
    }

    if ("rol" in updateData) {
      camposModificados.rol = {
        antes: usuarioActual.rol,
        despues: (updateData as any).rol,
      };
    }

    if ("activo" in updateData) {
      camposModificados.activo = {
        antes: usuarioActual.activo,
        despues: (updateData as any).activo,
      };
    }

    // Auditoría de actualización de usuario
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        accion: "ACTUALIZAR_USUARIO",
        adminId: session.userId,
        adminEmail: session.email,
        targetUserId: usuarioId,
        targetEmail: usuarioActual.email,
        camposModificados,
        autoModificacion: session.userId === usuarioId,
        ip:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      })
    );

    return NextResponse.json({
      usuario: {
        id: usuarioConRelacion.id,
        nombre: usuarioConRelacion.nombre,
        email: usuarioConRelacion.email,
        telefono: usuarioConRelacion.telefono,
        rol: usuarioConRelacion.rol,
        activo: usuarioConRelacion.activo,
        createdAt: usuarioConRelacion.createdAt,
        armador: usuarioConRelacion.armador
          ? {
              id: usuarioConRelacion.armador.id,
              estado: usuarioConRelacion.armador.estado,
              habilidades: usuarioConRelacion.armador.habilidades,
              ordenesActivas: usuarioConRelacion.armador.ordenes.length,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Error actualizando usuario:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
