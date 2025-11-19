type ReglaPayload = {
  tipoPrincipal: "COBRO_FIJO_UNITARIO" | "COBRO_POR_VOLUMEN";
  precioFijoUnitario?: number;
  precioVIP?: number;
  precioUrgente?: number;
  precioMedia?: number;
  precioNormal?: number;
  precioGrande?: number;
  precioMediano?: number;
  precioPequeno?: number;
  rangosVolumen?: {
    id?: string;
    desde: number;
    hasta?: number;
    precio: number;
  }[];
  cobrosDistancia?: {
    id?: string;
    municipio: string;
    precio: number;
  }[];
  penalizaciones?: {
    id?: string;
    tipo: "CLIENTE_NO_CONTESTO" | "PEDIDO_CANCELADO_EN_RUTA";
    precio: number;
  }[];
};

async function upsertReglaCobro(proyectoId: string, payload: ReglaPayload) {
  const existing = await prisma.reglaCobro.findUnique({
    where: { proyectoId },
    include: {
      rangosVolumen: true,
      cobrosDistancia: true,
      penalizaciones: true,
    },
  });

  const regla = await prisma.reglaCobro.upsert({
    where: { proyectoId },
    update: {
      tipoPrincipal: payload.tipoPrincipal,
      precioFijoUnitario: payload.precioFijoUnitario ?? null,
      precioVIP: payload.precioVIP ?? 0,
      precioUrgente: payload.precioUrgente ?? 0,
      precioMedia: payload.precioMedia ?? 0,
      precioNormal: payload.precioNormal ?? 0,
      precioGrande: payload.precioGrande ?? 0,
      precioMediano: payload.precioMediano ?? 0,
      precioPequeno: payload.precioPequeno ?? 0,
    },
    create: {
      proyectoId,
      tipoPrincipal: payload.tipoPrincipal,
      precioFijoUnitario: payload.precioFijoUnitario ?? null,
      precioVIP: payload.precioVIP ?? 0,
      precioUrgente: payload.precioUrgente ?? 0,
      precioMedia: payload.precioMedia ?? 0,
      precioNormal: payload.precioNormal ?? 0,
      precioGrande: payload.precioGrande ?? 0,
      precioMediano: payload.precioMediano ?? 0,
      precioPequeno: payload.precioPequeno ?? 0,
    },
  });

  await syncChildCollection({
    current: existing?.rangosVolumen ?? [],
    incoming: payload.rangosVolumen ?? [],
    deleteMany: (ids) =>
      prisma.rangoVolumen.deleteMany({ where: { id: { in: ids } } }),
    upsertOne: (item) =>
      prisma.rangoVolumen.upsert({
        where: { id: item.id ?? "" },
        update: {
          desde: item.desde,
          hasta: item.hasta ?? null,
          precio: item.precio,
        },
        create: {
          reglaCobroId: regla.id,
          desde: item.desde,
          hasta: item.hasta ?? null,
          precio: item.precio,
        },
      }),
  });

  await syncChildCollection({
    current: existing?.cobrosDistancia ?? [],
    incoming: payload.cobrosDistancia ?? [],
    deleteMany: (ids) =>
      prisma.cobroDistancia.deleteMany({ where: { id: { in: ids } } }),
    upsertOne: (item) =>
      prisma.cobroDistancia.upsert({
        where: { id: item.id ?? "" },
        update: {
          municipio: item.municipio,
          precio: item.precio,
        },
        create: {
          reglaCobroId: regla.id,
          municipio: item.municipio,
          precio: item.precio,
        },
      }),
  });

  await syncChildCollection({
    current: existing?.penalizaciones ?? [],
    incoming: payload.penalizaciones ?? [],
    deleteMany: (ids) =>
      prisma.penalizacion.deleteMany({ where: { id: { in: ids } } }),
    upsertOne: (item) =>
      prisma.penalizacion.upsert({
        where: { id: item.id ?? "" },
        update: {
          tipo: item.tipo,
          precio: item.precio,
        },
        create: {
          reglaCobroId: regla.id,
          tipo: item.tipo,
          precio: item.precio,
        },
      }),
  });
}

type SyncOptions<T extends { id?: string }> = {
  current: { id: string }[];
  incoming: T[];
  deleteMany: (ids: string[]) => Promise<unknown>;
  upsertOne: (item: T) => Promise<unknown>;
};

async function syncChildCollection<T extends { id?: string }>(options: SyncOptions<T>) {
  const { current, incoming, deleteMany, upsertOne } = options;

  const currentIds = new Set(current.map((item) => item.id));
  const incomingIds = new Set(
    incoming.filter((item) => item.id).map((item) => item.id as string)
  );

  const toDelete = [...currentIds].filter((id) => !incomingIds.has(id));
  if (toDelete.length) {
    await deleteMany(toDelete);
  }

  for (const item of incoming) {
    await upsertOne(item);
  }
}
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

// GET - Obtener proyecto por ID
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params;

  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const proyecto = await prisma.proyecto.findUnique({
      where: { id },
      include: {
        muebles: true,
        reglaCobro: {
          include: {
            rangosVolumen: true,
            cobrosDistancia: true,
            penalizaciones: true,
          },
        },
        _count: {
          select: {
            ordenes: true,
            usuariosFinales: true,
          },
        },
      },
    });

    if (!proyecto) {
      return NextResponse.json(
        { error: "Proyecto no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ proyecto });
  } catch (error) {
    console.error("Error obteniendo proyecto:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar proyecto y su regla de cobro
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params;

  try {
    const session = await getSession();

    if (!session || session.rol !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const {
      nombreComercial,
      tipoCliente,
      datosFacturacion,
      activo,
      reglaCobro,
    } = body;

    const proyecto = await prisma.proyecto.update({
      where: { id },
      data: {
        ...(nombreComercial && { nombreComercial }),
        ...(tipoCliente && { tipoCliente }),
        ...(datosFacturacion && { datosFacturacion }),
        ...(typeof activo === "boolean" && { activo }),
      },
      include: {
        reglaCobro: {
          include: {
            rangosVolumen: true,
            cobrosDistancia: true,
            penalizaciones: true,
          },
        },
      },
    });

    if (reglaCobro) {
      await upsertReglaCobro(id, reglaCobro);
    }

    const proyectoActualizado = await prisma.proyecto.findUnique({
      where: { id },
      include: {
        reglaCobro: {
          include: {
            rangosVolumen: true,
            cobrosDistancia: true,
            penalizaciones: true,
          },
        },
      },
    });

    return NextResponse.json({ proyecto: proyectoActualizado });
  } catch (error) {
    console.error("Error actualizando proyecto:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar proyecto
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params;

  try {
    const session = await getSession();

    if (!session || session.rol !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    await prisma.proyecto.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Proyecto eliminado" });
  } catch (error) {
    console.error("Error eliminando proyecto:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}