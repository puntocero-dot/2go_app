import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { withRateLimit, withRateLimitAndValidation } from '@/lib/api-helpers';
import { RATE_LIMITS } from '@/lib/rate-limit';
import { ReglaCobroSchema, ReglaCobroInput } from '@/lib/schemas/regla-cobro.schemas';
import { logAuditFromSession } from '@/lib/audit-logger';

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

const crearReglaHandler = async (
  data: ReglaCobroInput,
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session || session.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

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
      penalizaciones,
    } = data;

    const reglaExistente = await prisma.reglaCobro.findUnique({
      where: { proyectoId: id },
    });

    if (reglaExistente) {
      return NextResponse.json(
        { error: 'Ya existe una regla para este proyecto. Usa PUT para actualizar.' },
        { status: 400 }
      );
    }

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
          create: rangosVolumen.map((r) => ({
            desde: r.desde,
            hasta: r.hasta,
            precio: r.precio,
          })),
        } : undefined,
        cobrosDistancia: cobrosDistancia && cobrosDistancia.length > 0 ? {
          create: cobrosDistancia.map((c) => ({
            municipio: c.municipio,
            precio: c.precio,
          })),
        } : undefined,
        penalizaciones: penalizaciones && penalizaciones.length > 0 ? {
          create: penalizaciones.map((p) => ({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tipo: p.tipo as any,
            precio: p.precio ?? p.monto ?? 0,
          })),
        } : undefined,
      },
      include: {
        rangosVolumen: true,
        cobrosDistancia: true,
        penalizaciones: true,
      },
    });

    await logAuditFromSession({
      session,
      action: 'UPDATE_BILLING_CONFIG',
      resource: 'proyecto',
      resourceId: id,
      changes: {
        after: regla,
      },
      request: req,
    });

    return NextResponse.json({ regla }, { status: 201 });
  } catch (error) {
    console.error('Error al crear regla:', error);
    return NextResponse.json(
      { error: 'Error al crear regla' },
      { status: 500 }
    );
  }
};

export const POST = withRateLimitAndValidation(
  ReglaCobroSchema,
  RATE_LIMITS.DEFAULT,
  (request) => {
    const url = new URL(request.url);
    const proyectoId = url.pathname.split('/')[3];
    return `reglas-create:${proyectoId}`;
  },
  crearReglaHandler
);

const actualizarReglaHandler = async (
  data: ReglaCobroInput,
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session || session.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

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
      penalizaciones,
    } = data;

    const reglaExistente = await prisma.reglaCobro.findUnique({
      where: { proyectoId: id },
    });

    if (reglaExistente) {
      await prisma.$transaction([
        prisma.rangoVolumen.deleteMany({ where: { reglaCobroId: reglaExistente.id } }),
        prisma.cobroDistancia.deleteMany({ where: { reglaCobroId: reglaExistente.id } }),
        prisma.penalizacion.deleteMany({ where: { reglaCobroId: reglaExistente.id } }),
      ]);
    }

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
          create: rangosVolumen.map((r) => ({
            desde: r.desde,
            hasta: r.hasta,
            precio: r.precio,
          })),
        } : undefined,
        cobrosDistancia: cobrosDistancia && cobrosDistancia.length > 0 ? {
          create: cobrosDistancia.map((c) => ({
            municipio: c.municipio,
            precio: c.precio,
          })),
        } : undefined,
        penalizaciones: penalizaciones && penalizaciones.length > 0 ? {
          create: penalizaciones.map((p) => ({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tipo: p.tipo as any,
            precio: p.precio ?? p.monto ?? 0,
          })),
        } : undefined,
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
          create: rangosVolumen.map((r) => ({
            desde: r.desde,
            hasta: r.hasta,
            precio: r.precio,
          })),
        } : undefined,
        cobrosDistancia: cobrosDistancia && cobrosDistancia.length > 0 ? {
          create: cobrosDistancia.map((c) => ({
            municipio: c.municipio,
            precio: c.precio,
          })),
        } : undefined,
        penalizaciones: penalizaciones && penalizaciones.length > 0 ? {
          create: penalizaciones.map((p) => ({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tipo: p.tipo as any,
            precio: p.precio ?? p.monto ?? 0,
          })),
        } : undefined,
      },
      include: {
        rangosVolumen: true,
        cobrosDistancia: true,
        penalizaciones: true,
      },
    });

    await logAuditFromSession({
      session,
      action: 'UPDATE_BILLING_CONFIG',
      resource: 'proyecto',
      resourceId: id,
      changes: {
        before: reglaExistente || undefined,
        after: regla,
      },
      request: req,
    });

    return NextResponse.json({ regla });
  } catch (error) {
    console.error('Error al actualizar regla:', error);
    return NextResponse.json(
      { error: 'Error al actualizar regla' },
      { status: 500 }
    );
  }
};

export const PUT = withRateLimitAndValidation(
  ReglaCobroSchema,
  RATE_LIMITS.DEFAULT,
  (request) => {
    const url = new URL(request.url);
    const proyectoId = url.pathname.split('/')[3];
    return `reglas-update:${proyectoId}`;
  },
  actualizarReglaHandler
);

const eliminarReglaHandler = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session || session.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const reglaExistente = await prisma.reglaCobro.findUnique({
      where: { proyectoId: id },
    });

    await prisma.reglaCobro.delete({
      where: { proyectoId: id },
    });

    await logAuditFromSession({
      session,
      action: 'UPDATE_BILLING_CONFIG',
      resource: 'proyecto',
      resourceId: id,
      changes: {
        before: reglaExistente || undefined,
      },
      request: req,
    });

    return NextResponse.json({ mensaje: 'Regla eliminada' });
  } catch (error) {
    console.error('Error al eliminar regla:', error);
    return NextResponse.json(
      { error: 'Error al eliminar regla' },
      { status: 500 }
    );
  }
};

export const DELETE = withRateLimit(
  eliminarReglaHandler,
  RATE_LIMITS.DEFAULT,
  (request) => {
    const url = new URL(request.url);
    const proyectoId = url.pathname.split('/')[3];
    return `reglas-delete:${proyectoId}`;
  }
);