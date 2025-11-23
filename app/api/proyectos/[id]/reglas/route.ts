import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET - Obtener regla actual
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session || session.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const regla = await prisma.reglaCobro.findUnique({
      where: { proyectoId: id }
    });

    return NextResponse.json({ regla });
  } catch (error) {
    console.error('Error al obtener regla:', error);
    return NextResponse.json(
      { error: 'Error al obtener regla' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva regla
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session || session.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { tipoPrincipal, precioFijoUnitario, rangosVolumen } = body;

    // Validar que no exista ya una regla
    const reglaExistente = await prisma.reglaCobro.findUnique({
      where: { proyectoId: id }
    });

    if (reglaExistente) {
      return NextResponse.json(
        { error: 'Ya existe una regla para este proyecto. Usa PUT para actualizar.' },
        { status: 400 }
      );
    }

    // Crear regla
    const regla = await prisma.reglaCobro.create({
      data: {
        proyectoId: id,
        tipoPrincipal,
        precioFijoUnitario: tipoPrincipal === 'COBRO_FIJO_UNITARIO' ? precioFijoUnitario : null,
        rangosVolumen: tipoPrincipal === 'COBRO_POR_VOLUMEN' ? rangosVolumen : null
      }
    });

    return NextResponse.json({ regla }, { status: 201 });
  } catch (error) {
    console.error('Error al crear regla:', error);
    return NextResponse.json(
      { error: 'Error al crear regla' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar regla existente
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session || session.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { tipoPrincipal, precioFijoUnitario, rangosVolumen } = body;

    // Actualizar o crear si no existe
    const regla = await prisma.reglaCobro.upsert({
      where: { proyectoId: id },
      update: {
        tipoPrincipal,
        precioFijoUnitario: tipoPrincipal === 'COBRO_FIJO_UNITARIO' ? precioFijoUnitario : null,
        rangosVolumen: tipoPrincipal === 'COBRO_POR_VOLUMEN' ? rangosVolumen : null
      },
      create: {
        proyectoId: id,
        tipoPrincipal,
        precioFijoUnitario: tipoPrincipal === 'COBRO_FIJO_UNITARIO' ? precioFijoUnitario : null,
        rangosVolumen: tipoPrincipal === 'COBRO_POR_VOLUMEN' ? rangosVolumen : null
      }
    });

    return NextResponse.json({ regla });
  } catch (error) {
    console.error('Error al actualizar regla:', error);
    return NextResponse.json(
      { error: 'Error al actualizar regla' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar regla
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session || session.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await prisma.reglaCobro.delete({
      where: { proyectoId: id }
    });

    return NextResponse.json({ mensaje: 'Regla eliminada' });
  } catch (error) {
    console.error('Error al eliminar regla:', error);
    return NextResponse.json(
      { error: 'Error al eliminar regla' },
      { status: 500 }
    );
  }
}