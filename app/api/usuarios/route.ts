import { NextRequest, NextResponse } from "next/server";
import { getSession, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditFromSession } from "@/lib/audit-logger";
import {
  crearUsuarioSchema,
  rolesPermitidos,
  estadosArmadorPermitidos,
} from "@/lib/schemas/usuario.schema";

const ROLES_PERMITIDOS = rolesPermitidos;
type RolPermitido = (typeof ROLES_PERMITIDOS)[number];
const ESTADOS_ARMADOR = estadosArmadorPermitidos;
type EstadoArmadorPermitido = (typeof ESTADOS_ARMADOR)[number];

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || session.rol !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const rolFiltro = searchParams.get("rol");

    const where = rolFiltro && ROLES_PERMITIDOS.includes(rolFiltro as RolPermitido)
      ? { rol: rolFiltro as RolPermitido }
      : {};

    const usuarios = await prisma.usuario.findMany({
      where,
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
              select: {
                id: true,
              },
            },
          },
        },
        supervisorProyectos: {
          include: {
            proyecto: {
              select: { id: true, nombreComercial: true },
            },
          },
        },
      },
    });

    const payload = usuarios.map((usuario) => ({
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      telefono: usuario.telefono,
      rol: usuario.rol,
      activo: usuario.activo,
      createdAt: usuario.createdAt,
      armador: usuario.armador
        ? {
            id: usuario.armador.id,
            estado: usuario.armador.estado,
            habilidades: usuario.armador.habilidades,
            ordenesActivas: usuario.armador.ordenes.length,
          }
        : null,
      proyectos: usuario.supervisorProyectos.map(sp => ({
        id: sp.proyecto.id,
        nombreComercial: sp.proyecto.nombreComercial,
      })),
    }));

    return NextResponse.json({ usuarios: payload });
  } catch (error) {
    console.error("Error obteniendo usuarios:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || session.rol !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const rawBody = await request.json();
    const parsed = crearUsuarioSchema.safeParse(rawBody);

    if (!parsed.success) {
      const detalles = parsed.error.flatten();
      return NextResponse.json(
        { error: "Datos inválidos", detalles },
        { status: 400 }
      );
    }

    const {
      nombre,
      email,
      telefono,
      password,
      rol,
      estadoArmador,
      habilidades,
    } = parsed.data;

    const proyectosIds = Array.isArray(rawBody.proyectosIds) ? rawBody.proyectosIds : [];

    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email },
      select: { id: true },
    });

    if (usuarioExistente) {
      return NextResponse.json(
        { error: "Ya existe un usuario con este correo" },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const resultado = await prisma.$transaction(async (tx) => {
      const telefonoNormalizado =
        typeof telefono === "string" && telefono.trim().length > 0
          ? telefono.trim()
          : null;

      const nuevoUsuario = await tx.usuario.create({
        data: {
          nombre,
          email,
          telefono: telefonoNormalizado,
          password: hashedPassword,
          rol,
        },
      });

      if (rol === "ARMADOR") {
        const estado: EstadoArmadorPermitido =
          estadoArmador && ESTADOS_ARMADOR.includes(estadoArmador)
            ? estadoArmador
            : "ACTIVO";

        const habilidadesProcesadas = Array.isArray(habilidades)
          ? habilidades
              .map((skill) => (typeof skill === "string" ? skill.trim() : ""))
              .filter((skill) => skill.length > 0)
          : typeof habilidades === "string"
          ? habilidades
              .split(",")
              .map((skill) => skill.trim())
              .filter((skill) => skill.length > 0)
          : [];

        await tx.armador.create({
          data: {
            usuarioId: nuevoUsuario.id,
            estado,
            habilidades: habilidadesProcesadas,
          },
        });
      }

      if (rol === "SUPERVISOR" && proyectosIds.length > 0) {
        await tx.supervisorProyecto.createMany({
          data: proyectosIds.map((proyectoId: string) => ({
            usuarioId: nuevoUsuario.id,
            proyectoId,
          })),
        });
      }

      return nuevoUsuario;
    });

    const usuarioCreado = await prisma.usuario.findUnique({
      where: { id: resultado.id },
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
        supervisorProyectos: {
          include: {
            proyecto: {
              select: { id: true, nombreComercial: true },
            },
          },
        },
      },
    });

    if (!usuarioCreado) {
      throw new Error("No se pudo recuperar el usuario creado");
    }

    await logAuditFromSession({
      session,
      action: "CREATE_USER",
      resource: "usuario",
      resourceId: usuarioCreado.id,
      changes: {
        after: {
          nombre: usuarioCreado.nombre,
          email: usuarioCreado.email,
          rol: usuarioCreado.rol,
          activo: usuarioCreado.activo,
        },
      },
      request,
    });

    return NextResponse.json(
      {
        usuario: {
          id: usuarioCreado.id,
          nombre: usuarioCreado.nombre,
          email: usuarioCreado.email,
          telefono: usuarioCreado.telefono,
          rol: usuarioCreado.rol,
          activo: usuarioCreado.activo,
          createdAt: usuarioCreado.createdAt,
          armador: usuarioCreado.armador
            ? {
                id: usuarioCreado.armador.id,
                estado: usuarioCreado.armador.estado,
                habilidades: usuarioCreado.armador.habilidades,
                ordenesActivas: usuarioCreado.armador.ordenes.length,
              }
            : null,
          proyectos: usuarioCreado.supervisorProyectos.map(sp => ({
            id: sp.proyecto.id,
            nombreComercial: sp.proyecto.nombreComercial,
          })),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creando usuario:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
