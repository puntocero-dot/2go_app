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
    const { 
      tipoPrincipal, 
      precioFijoUnitario, 
      rangosVolumen,
      precioVIP,
      precioUrgente,
      precioMedia,
      precioNormal,
      precioGrande,
      precioMediano,
      precioPequeno,
      cobrosDistancia,
      penalizaciones
    } = body;

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

    // Crear regla con transacción para incluir relaciones
    const regla = await prisma.reglaCobro.create({
      data: {
        proyectoId: id,
        tipoPrincipal,
        precioFijoUnitario: tipoPrincipal === 'COBRO_FIJO_UNITARIO' ? precioFijoUnitario : null,
        precioVIP: precioVIP || 0,
        precioUrgente: precioUrgente || 0,
        precioMedia: precioMedia || 0,
        precioNormal: precioNormal || 0,
        precioGrande: precioGrande || 0,
        precioMediano: precioMediano || 0,
        precioPequeno: precioPequeno || 0,
        rangosVolumen: tipoPrincipal === 'COBRO_POR_VOLUMEN' && rangosVolumen ? {
          create: rangosVolumen.map((r: any) => ({
            desde: r.desde,
            hasta: r.hasta,
            precio: r.precio
          }))
        } : undefined,
        cobrosDistancia: cobrosDistancia && cobrosDistancia.length > 0 ? {
          create: cobrosDistancia.map((c: any) => ({
            municipio: c.municipio,
            precio: c.precio
          }))
        } : undefined,
        penalizaciones: penalizaciones && penalizaciones.length > 0 ? {
          create: penalizaciones.map((p: any) => ({
            tipo: p.tipo,
            precio: p.precio ?? 0
          }))
        } : undefined
      },
      include: {
        rangosVolumen: true,
        cobrosDistancia: true,
        penalizaciones: true
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
    const { 
      tipoPrincipal, 
      precioFijoUnitario, 
      rangosVolumen,
      precioVIP,
      precioUrgente,
      precioMedia,
      precioNormal,
      precioGrande,
      precioMediano,
      precioPequeno,
      cobrosDistancia,
      penalizaciones
    } = body;

    // Primero eliminar relaciones existentes
    const reglaExistente = await prisma.reglaCobro.findUnique({
      where: { proyectoId: id }
    });

    if (reglaExistente) {
      await prisma.$transaction([
        prisma.rangoVolumen.deleteMany({ where: { reglaCobroId: reglaExistente.id } }),
        prisma.cobroDistancia.deleteMany({ where: { reglaCobroId: reglaExistente.id } }),
        prisma.penalizacion.deleteMany({ where: { reglaCobroId: reglaExistente.id } })
      ]);
    }

    // Actualizar o crear con nuevas relaciones
    const regla = await prisma.reglaCobro.upsert({
      where: { proyectoId: id },
      update: {
        tipoPrincipal,
        precioFijoUnitario: tipoPrincipal === 'COBRO_FIJO_UNITARIO' ? precioFijoUnitario : null,
        precioVIP: precioVIP || 0,
        precioUrgente: precioUrgente || 0,
        precioMedia: precioMedia || 0,
        precioNormal: precioNormal || 0,
        precioGrande: precioGrande || 0,
        precioMediano: precioMediano || 0,
        precioPequeno: precioPequeno || 0,
        rangosVolumen: tipoPrincipal === 'COBRO_POR_VOLUMEN' && rangosVolumen ? {
          create: rangosVolumen.map((r: any) => ({
            desde: r.desde,
            hasta: r.hasta,
            precio: r.precio
          }))
        } : undefined,
        cobrosDistancia: cobrosDistancia && cobrosDistancia.length > 0 ? {
          create: cobrosDistancia.map((c: any) => ({
            municipio: c.municipio,
            precio: c.precio
          }))
        } : undefined,
        penalizaciones: penalizaciones && penalizaciones.length > 0 ? {
          create: penalizaciones.map((p: any) => ({
            tipo: p.tipo,
            precio: p.precio ?? p.monto ?? 0
          }))
        } : undefined
      },
      create: {
        proyectoId: id,
        tipoPrincipal,
        precioFijoUnitario: tipoPrincipal === 'COBRO_FIJO_UNITARIO' ? precioFijoUnitario : null,
        precioVIP: precioVIP || 0,
        precioUrgente: precioUrgente || 0,
        precioMedia: precioMedia || 0,
        precioNormal: precioNormal || 0,
        precioGrande: precioGrande || 0,
        precioMediano: precioMediano || 0,
        precioPequeno: precioPequeno || 0,
        rangosVolumen: tipoPrincipal === 'COBRO_POR_VOLUMEN' && rangosVolumen ? {
          create: rangosVolumen.map((r: any) => ({
            desde: r.desde,
            hasta: r.hasta,
            precio: r.precio
          }))
        } : undefined,
        cobrosDistancia: cobrosDistancia && cobrosDistancia.length > 0 ? {
          create: cobrosDistancia.map((c: any) => ({
            municipio: c.municipio,
            precio: c.precio
          }))
        } : undefined,
        penalizaciones: penalizaciones && penalizaciones.length > 0 ? {
          create: penalizaciones.map((p: any) => ({
            tipo: p.tipo,
            precio: p.precio ?? p.monto ?? 0
          }))
        } : undefined
      },
      include: {
        rangosVolumen: true,
        cobrosDistancia: true,
        penalizaciones: true
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