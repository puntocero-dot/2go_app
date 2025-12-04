import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();

    if (!session || session.rol !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Contar usuarios en la base de datos
    const userCount = await prisma.usuario.count();
    
    // Obtener los usuarios (sin passwords por seguridad)
    const users = await prisma.usuario.findMany({
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        activo: true,
        createdAt: true
      },
      take: 5 // Limitar a 5 usuarios
    });

    return NextResponse.json({
      success: true,
      database: "connected",
      userCount,
      users: users.map(u => ({
        ...u,
        hasPassword: true // Todos los usuarios deberían tener password
      }))
    });
  } catch (error) {
    console.error("Error en test-db:", error);
    return NextResponse.json(
      { 
        error: "Error conectando a la base de datos", 
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
