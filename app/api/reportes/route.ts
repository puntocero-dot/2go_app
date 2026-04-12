import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { getBillingDataset } from "@/lib/facturacion-data";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || session.rol !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const source = searchParams.get("source") || "ordenes";
    const _fields = searchParams.get("fields")?.split(",") || [];
    const fechaInicio = searchParams.get("fechaInicio");
    const fechaFin = searchParams.get("fechaFin");
    const proyectoId = searchParams.get("proyectoId");
    const armadorId = searchParams.get("armadorId");
    const estado = searchParams.get("estado");

    let data: Record<string, unknown>[] = [];

    switch (source) {
      case "ordenes": {
        const where: Prisma.OrdenWhereInput = {};

        if (proyectoId && proyectoId !== "ALL") {
          where.proyectoId = proyectoId;
        }
        if (armadorId && armadorId !== "ALL") {
          where.armadorId = armadorId;
        }
        if (estado && estado !== "ALL") {
          where.estado = estado as Prisma.EnumEstadoOrdenFilter["equals"];
        }
        if (fechaInicio || fechaFin) {
          where.fechaCreacion = {};
          if (fechaInicio) {
            where.fechaCreacion.gte = new Date(`${fechaInicio}T00:00:00`);
          }
          if (fechaFin) {
            where.fechaCreacion.lte = new Date(`${fechaFin}T23:59:59`);
          }
        }

        const ordenes = await prisma.orden.findMany({
          where,
          include: {
            proyecto: { select: { nombreComercial: true } },
            armador: { include: { usuario: { select: { nombre: true } } } },
            usuarioFinal: { select: { nombre: true, municipio: true } },
          },
          orderBy: { fechaCreacion: "desc" },
          take: 1000,
        });

        data = ordenes.map((o) => ({
          codigoReferenciaRetail: o.codigoReferenciaRetail,
          estado: o.estado,
          proyecto: o.proyecto?.nombreComercial || "N/A",
          armador: o.armador?.usuario?.nombre || "Sin asignar",
          cliente: o.usuarioFinal?.nombre || "N/A",
          municipio: o.usuarioFinal?.municipio || "N/A",
          prioridad: o.prioridad,
          fechaCreacion: o.fechaCreacion,
          fechaCompletado: o.fechaCompletado,
          cantidad: 1,
        }));
        break;
      }

      case "armadores": {
        const armadores = await prisma.armador.findMany({
          include: {
            usuario: { select: { nombre: true, estadoLoggeo: true, updatedAt: true } },
            _count: {
              select: {
                ordenes: true,
              },
            },
          },
        });

        // Obtener todas las estadísticas en una sola query
        const ordenesStats = await prisma.orden.groupBy({
          by: ["armadorId", "estado"],
          _count: { id: true },
          where: {
            armadorId: { not: null },
          },
        });

        // Procesar estadísticas en memoria
        const statsMap = new Map<string, { activas: number; completadas: number }>();
        
        for (const stat of ordenesStats) {
          if (!stat.armadorId) continue;
          
          if (!statsMap.has(stat.armadorId)) {
            statsMap.set(stat.armadorId, { activas: 0, completadas: 0 });
          }
          
          const current = statsMap.get(stat.armadorId)!;
          if (stat.estado === "ARMADO_COMPLETADO") {
            current.completadas += stat._count.id;
          } else if (["ASIGNADO", "EN_RUTA", "ARMADO_INICIADO"].includes(stat.estado)) {
            current.activas += stat._count.id;
          }
        }

        data = armadores.map((a) => {
          const stats = statsMap.get(a.id) || { activas: 0, completadas: 0 };
          return {
            nombre: a.usuario.nombre,
            estado: a.estado,
            ordenesActivas: stats.activas,
            ordenesCompletadas: stats.completadas,
            ultimaActividad: a.usuario.updatedAt,
          };
        });
        break;
      }

      case "proyectos": {
        const proyectos = await prisma.proyecto.findMany({
          where: { activo: true },
          include: {
            _count: {
              select: { ordenes: true },
            },
          },
        });

        // Contar órdenes por estado por proyecto
        const ordenesCompletadas = await prisma.orden.groupBy({
          by: ["proyectoId"],
          _count: { id: true },
          where: { estado: "ARMADO_COMPLETADO" },
        });

        const ordenesActivas = await prisma.orden.groupBy({
          by: ["proyectoId"],
          _count: { id: true },
          where: {
            estado: { in: ["ASIGNADO", "EN_RUTA", "ARMADO_INICIADO", "SIN_ASIGNAR"] },
          },
        });

        const completadasMap = new Map(
          ordenesCompletadas.map((o) => [o.proyectoId, o._count.id])
        );
        const activasMap = new Map(
          ordenesActivas.map((o) => [o.proyectoId, o._count.id])
        );

        data = proyectos.map((p) => ({
          nombreComercial: p.nombreComercial,
          tipoCliente: p.tipoCliente,
          totalOrdenes: p._count.ordenes,
          ordenesActivas: activasMap.get(p.id) || 0,
          ordenesCompletadas: completadasMap.get(p.id) || 0,
        }));
        break;
      }

      case "turnos": {
        const where: Prisma.TurnoWhereInput = {};

        if (armadorId && armadorId !== "ALL") {
          where.armadorId = armadorId;
        }
        if (fechaInicio || fechaFin) {
          where.inicioTurno = {};
          if (fechaInicio) {
            where.inicioTurno.gte = new Date(`${fechaInicio}T00:00:00`);
          }
          if (fechaFin) {
            where.inicioTurno.lte = new Date(`${fechaFin}T23:59:59`);
          }
        }

        const turnos = await prisma.turno.findMany({
          where,
          include: {
            armador: { include: { usuario: { select: { nombre: true } } } },
            _count: { select: { rutaPuntos: true } },
          },
          orderBy: { inicioTurno: "desc" },
          take: 500,
        });

        data = turnos.map((t) => {
          const duracion = t.finTurno
            ? (new Date(t.finTurno).getTime() - new Date(t.inicioTurno).getTime()) /
              (1000 * 60 * 60)
            : 0;

          return {
            armador: t.armador.usuario.nombre,
            estado: t.estado,
            fechaInicio: t.inicioTurno,
            fechaFin: t.finTurno,
            duracionHoras: Math.round(duracion * 100) / 100,
            puntosGPS: t._count.rutaPuntos,
          };
        });
        break;
      }

      case "facturacion": {
        if (!fechaInicio || !fechaFin) {
          return NextResponse.json({
            data: [],
            message: "Se requieren fechas para el reporte de facturación",
          });
        }

        // Obtener todos los proyectos activos
        const proyectos = await prisma.proyecto.findMany({
          where: { activo: true },
          select: { id: true, nombreComercial: true },
        });

        const resultados: Record<string, unknown>[] = [];

        for (const proyecto of proyectos) {
          const billingData = await getBillingDataset({
            proyectoId: proyecto.id,
            desde: fechaInicio,
            hasta: fechaFin,
          });

          if (billingData && billingData.ordenes.length > 0) {
            resultados.push({
              proyecto: proyecto.nombreComercial,
              periodo: billingData.periodoLabel,
              ordenesFacturadas: billingData.ordenes.length,
              totalArmado: billingData.totalsByConcept.armado,
              totalDistancia: billingData.totalsByConcept.distancia,
              totalPenalizaciones: billingData.totalsByConcept.penalizacion,
              totalFacturado: billingData.totalsByConcept.totalFacturado,
            });
          }
        }

        data = resultados;
        break;
      }

      default:
        return NextResponse.json(
          { error: "Fuente de datos no válida" },
          { status: 400 }
        );
    }

    const response = NextResponse.json({ data });
    
    // Agregar cache headers para reportes (5 minutos)
    response.headers.set('Cache-Control', 'private, max-age=300, stale-while-revalidate=600');
    
    return response;
  } catch (error) {
    console.error("Error en reporte:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
