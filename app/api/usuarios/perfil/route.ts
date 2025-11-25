import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET - Obtener perfil del usuario actual
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        nombre: true,
        telefono: true,
        rol: true,
        fotoPerfil: true,
        estadoLoggeo: true,
        createdAt: true,
      },
    });

    if (!usuario) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json(usuario);
  } catch (error) {
    console.error("Error obteniendo perfil:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar perfil del usuario
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const { nombre, telefono, fotoPerfil, password, passwordActual } = body;

    // Si se quiere cambiar la contraseña, verificar la actual
    if (password) {
      if (!passwordActual) {
        return NextResponse.json(
          { error: "Debes proporcionar tu contraseña actual" },
          { status: 400 }
        );
      }

      const usuario = await prisma.usuario.findUnique({
        where: { id: session.userId },
      });

      if (!usuario) {
        return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
      }

      const passwordValida = await bcrypt.compare(passwordActual, usuario.password);

      if (!passwordValida) {
        return NextResponse.json(
          { error: "Contraseña actual incorrecta" },
          { status: 400 }
        );
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const usuarioActualizado = await prisma.usuario.update({
        where: { id: session.userId },
        data: {
          nombre,
          telefono,
          fotoPerfil,
          password: hashedPassword,
        },
        select: {
          id: true,
          email: true,
          nombre: true,
          telefono: true,
          rol: true,
          fotoPerfil: true,
          estadoLoggeo: true,
        },
      });

      return NextResponse.json(usuarioActualizado);
    }

    // Actualizar sin cambiar contraseña
    const usuarioActualizado = await prisma.usuario.update({
      where: { id: session.userId },
      data: {
        nombre,
        telefono,
        fotoPerfil,
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        telefono: true,
        rol: true,
        fotoPerfil: true,
        estadoLoggeo: true,
      },
    });

    return NextResponse.json(usuarioActualizado);
  } catch (error) {
    console.error("Error actualizando perfil:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
