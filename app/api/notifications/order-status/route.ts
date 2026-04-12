import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateOrderStatusEmailHTML } from "@/lib/email-templates";
import { checkRateLimit } from "@/lib/rate-limit";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// GET - Obtener notificaciones de una orden
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const orden = await prisma.orden.findUnique({
      where: { id },
      include: {
        proyecto: { select: { nombreComercial: true } },
        usuarioFinal: { select: { nombre: true, email: true } },
        armador: { 
          include: { 
            usuario: { select: { nombre: true, email: true } } 
          } 
        }
      }
    });

    if (!orden) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    // Verificar permisos - simplificado sin proyectoId/armadorId en session
    const canAccess = session.rol === 'ADMIN' || 
                     session.rol === 'SUPERVISOR' ||
                     (session.rol === 'ARMADOR' && orden.armador?.usuarioId === session.userId);

    if (!canAccess) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    return NextResponse.json({ orden });
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST - Enviar notificación de estado
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    
    if (!session || !['ADMIN', 'SUPERVISOR'].includes(session.rol)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Rate limiting
    const rate = await checkRateLimit(`notification_send:${session.userId}`, {
      windowMs: 60 * 1000, // 1 minuto
      maxRequests: 10,
    });

    if (!rate.ok) {
      return NextResponse.json(
        { error: "Demasiadas notificaciones enviadas. Espera un momento." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { tipoNotificacion } = body;

    // Obtener datos de la orden
    const orden = await prisma.orden.findUnique({
      where: { id },
      include: {
        proyecto: { select: { nombreComercial: true } },
        usuarioFinal: { select: { nombre: true, email: true, telefono: true } },
        armador: { 
          include: { 
            usuario: { select: { nombre: true, email: true } } 
          } 
        }
      }
    });

    if (!orden) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    // Verificar permisos - simplificado
    const canAccess = session.rol === 'ADMIN' || session.rol === 'SUPERVISOR';

    if (!canAccess) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Mapeo de estados a descripciones
    const estadoDescriptions = {
      'SIN_ASIGNAR': '📋 Orden creada y pendiente de asignación',
      'ASIGNADO': '👤 Orden asignada a un armador',
      'EN_RUTA': '🚚 El armador está en camino al destino',
      'ARMADO_INICIADO': '🔧 El armado ha comenzado',
      'ARMADO_FINALIZADO': '✅ Armado completado, listo para entrega',
      'ARMADO_COMPLETADO': '🎉 ¡Orden entregada con éxito!',
      'CANCELADA': '❌ Orden cancelada'
    };

    const statusDescription = estadoDescriptions[orden.estado as keyof typeof estadoDescriptions] || 'Estado actualizado';

    // Calcular entrega estimada
    let estimatedDelivery = undefined;
    if (orden.estado === 'ASIGNADO' || orden.estado === 'EN_RUTA') {
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 2); // Estimación de 2 días
      estimatedDelivery = deliveryDate.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }

    // Generar HTML del email
    const emailHTML = generateOrderStatusEmailHTML(
      orden.codigoReferenciaRetail,
      orden.proyecto.nombreComercial,
      orden.usuarioFinal.nombre,
      orden.estado,
      statusDescription,
      estimatedDelivery
    );

    // Enviar email al cliente
    if (orden.usuarioFinal.email) {
      try {
        await resend.emails.send({
          from: process.env.EMAIL_FROM || "noreply@armados2go.com",
          to: orden.usuarioFinal.email,
          subject: `📦 Actualización de tu Orden ${orden.codigoReferenciaRetail}`,
          html: emailHTML,
        });

        console.log(`Notificación enviada a ${orden.usuarioFinal.email} para orden ${orden.codigoReferenciaRetail}`);
      } catch (emailError) {
        console.error('Error al enviar email:', emailError);
        // No fallar toda la operación si el email falla
      }
    }

    // Registrar notificación en la base de datos
    await prisma.notificacion.create({
      data: {
        ordenId: orden.id,
        tipo: tipoNotificacion || 'ESTADO_ACTUALIZADO',
        mensaje: statusDescription,
        destinatarioId: orden.usuarioFinalId,
        enviado: true,
        fechaEnvio: new Date()
      }
    });

    return NextResponse.json({
      message: 'Notificación enviada exitosamente',
      ordenId: orden.id,
      estado: orden.estado,
      destinatario: orden.usuarioFinal.email
    });

  } catch (error) {
    console.error('Error al enviar notificación:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
