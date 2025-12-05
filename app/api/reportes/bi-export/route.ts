import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/api-helpers';
import { RATE_LIMITS } from '@/lib/rate-limit';
import { ReporteBIFiltrosSchema } from '@/lib/schemas/reportes.schemas';
import { logAuditFromSession } from '@/lib/audit-logger';

const biExportHandler = async (req: NextRequest) => {
  try {
    const session = await getSession();
    if (!session || !['ADMIN', 'SUPERVISOR'].includes(session.rol)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const rawFilters = {
      proyectoId: searchParams.get('proyectoId') || undefined,
      fechaInicio: searchParams.get('fechaInicio') || undefined,
      fechaFin: searchParams.get('fechaFin') || undefined,
      format: (searchParams.get('format') || undefined) as any,
    };

    const parsed = ReporteBIFiltrosSchema.safeParse(rawFilters);

    if (!parsed.success) {
      const detalles = parsed.error.flatten();
      return NextResponse.json(
        { error: 'Parámetros de filtro inválidos', detalles },
        { status: 400 }
      );
    }

    const {
      proyectoId,
      fechaInicio,
      fechaFin,
      format: formatRaw,
    } = parsed.data;

    const format = formatRaw || 'csv';

    const where: any = {};
    if (proyectoId && proyectoId !== 'ALL') {
      where.proyectoId = proyectoId;
    }
    if (fechaInicio || fechaFin) {
      const rangoFechas: any = {};
      if (fechaInicio) {
        rangoFechas.gte = new Date(`${fechaInicio}T00:00:00.000Z`);
      }
      if (fechaFin) {
        rangoFechas.lte = new Date(`${fechaFin}T23:59:59.999Z`);
      }

      where.OR = [
        { fechaCreacion: rangoFechas },
        { fechaCompletado: rangoFechas },
      ];
    }

    const ordenes = await prisma.orden.findMany({
      where,
      include: {
        proyecto: { select: { nombreComercial: true } },
        armador: { include: { usuario: { select: { nombre: true } } } },
        usuarioFinal: { select: { nombre: true, municipio: true } }
      },
      orderBy: { fechaCreacion: 'desc' }
    });

    await logAuditFromSession({
      session,
      action: 'EXPORT_DATA',
      resource: 'sistema',
      resourceId: proyectoId && proyectoId !== 'ALL' ? proyectoId : undefined,
      metadata: {
        tipo: 'BI_EXPORT',
        format,
        proyectoId: proyectoId || 'ALL',
        fechaInicio: fechaInicio || null,
        fechaFin: fechaFin || null,
        totalOrdenes: ordenes.length,
      },
      request: req,
    });

    if (format === 'csv') {
      // Generar CSV
      const headers = [
        'Fecha Creación',
        'Código',
        'Proyecto',
        'Cliente',
        'Municipio',
        'Armador',
        'Estado',
        'Fecha Completado',
        'Tiempo (horas)'
      ];

      const rows = ordenes.map(orden => {
        const tiempoHoras = orden.fechaCompletado
          ? ((orden.fechaCompletado.getTime() - orden.fechaCreacion.getTime()) / (1000 * 60 * 60)).toFixed(2)
          : 'N/A';

        return [
          orden.fechaCreacion.toISOString().split('T')[0],
          orden.codigoReferenciaRetail,
          orden.proyecto.nombreComercial,
          orden.usuarioFinal?.nombre || 'N/A',
          orden.usuarioFinal?.municipio || 'N/A',
          orden.armador?.usuario.nombre || 'Sin asignar',
          orden.estado,
          orden.fechaCompletado?.toISOString().split('T')[0] || 'N/A',
          tiempoHoras
        ];
      });

      const csvContent = '\uFEFF' + [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="reporte-bi-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    } else {
      // Generar PDF simple
      const totalOrdenes = ordenes.length;
      const completadas = ordenes.filter(o => o.estado === 'ARMADO_COMPLETADO').length;
      const tasaCompletion = totalOrdenes > 0 ? ((completadas / totalOrdenes) * 100).toFixed(1) : '0';

      const ordenesConTiempo = ordenes.filter(o => o.fechaCompletado);
      const tiempoPromedio = ordenesConTiempo.length > 0
        ? (ordenesConTiempo.reduce((sum, o) => {
            return sum + (o.fechaCompletado!.getTime() - o.fechaCreacion.getTime()) / (1000 * 60 * 60);
          }, 0) / ordenesConTiempo.length).toFixed(1)
        : 'N/A';

      const pdfContent = `
REPORTE BUSINESS INTELLIGENCE
Fecha: ${new Date().toLocaleDateString('es-SV')}
${proyectoId && proyectoId !== 'ALL' ? `Proyecto: ${ordenes[0]?.proyecto.nombreComercial || 'N/A'}` : 'Todos los proyectos'}
${fechaInicio ? `Desde: ${fechaInicio}` : ''}
${fechaFin ? `Hasta: ${fechaFin}` : ''}

RESUMEN EJECUTIVO
================
Total de Órdenes: ${totalOrdenes}
Órdenes Completadas: ${completadas}
Tasa de Completion: ${tasaCompletion}%
Tiempo Promedio de Entrega: ${tiempoPromedio} horas

DETALLE DE ÓRDENES
==================
${ordenes.slice(0, 50).map((o, i) => `
${i + 1}. ${o.codigoReferenciaRetail}
   Proyecto: ${o.proyecto.nombreComercial}
   Cliente: ${o.usuarioFinal?.nombre || 'N/A'}
   Estado: ${o.estado}
   Armador: ${o.armador?.usuario.nombre || 'Sin asignar'}
   Fecha: ${o.fechaCreacion.toLocaleDateString('es-SV')}
`).join('\n')}

${ordenes.length > 50 ? `\n... y ${ordenes.length - 50} órdenes más` : ''}
      `.trim();

      return new NextResponse(pdfContent, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="reporte-bi-${new Date().toISOString().split('T')[0]}.txt"`
        }
      });
    }
  } catch (error) {
    console.error('Error al exportar reporte BI:', error);
    return NextResponse.json(
      { error: 'Error al exportar reporte' },
      { status: 500 }
    );
  }
};

export const GET = withRateLimit(
  biExportHandler,
  RATE_LIMITS.DEFAULT,
  (request) => {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    return `bi-export:${ip}`;
  }
);
