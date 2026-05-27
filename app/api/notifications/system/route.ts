import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSystemNotificationEmailHTML } from "@/lib/email-templates";
import { checkRateLimit } from "@/lib/rate-limit";
import { withCsrf } from "@/lib/api-helpers";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// POST - Enviar notificación del sistema a todos los usuarios
const postHandler = async (req: NextRequest): Promise<Response> => {
  try {
    const session = await getSession();
    
    if (!session || session.rol !== "ADMIN") {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Rate limiting
    const rate = await checkRateLimit(`system_notification:${session.userId}`, {
      windowMs: 5 * 60 * 1000, // 5 minutos
      maxRequests: 3,
    });

    if (!rate.ok) {
      return NextResponse.json(
        { error: "Demasiadas notificaciones del sistema. Espera unos minutos." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { title, message, actionUrl, actionText } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: "El título y el mensaje son requeridos" },
        { status: 400 }
      );
    }

    // Obtener todos los usuarios activos
    const usuarios = await prisma.usuario.findMany({
      where: {
        activo: true,
        email: {
          not: undefined
        }
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true
      }
    });

    if (usuarios.length === 0) {
      return NextResponse.json(
        { error: "No hay usuarios activos para notificar" },
        { status: 404 }
      );
    }

    // Generar HTML del email
    const emailHTML = generateSystemNotificationEmailHTML(
      title,
      message,
      actionUrl,
      actionText
    );

    // Enviar emails a todos los usuarios (en lotes para no sobrecargar)
    const batchSize = 50; // Enviar en lotes de 50
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < usuarios.length; i += batchSize) {
      const batch = usuarios.slice(i, i + batchSize);
      
      const emailPromises = batch.map(async (usuario) => {
        try {
          await resend.emails.send({
            from: process.env.EMAIL_FROM || "noreply@armados2go.com",
            to: usuario.email!,
            subject: `🔔 ${title}`,
            html: emailHTML,
          });
          return { success: true, email: usuario.email };
        } catch (error) {
          console.error(`Error enviando email a ${usuario.email}:`, error);
          return { success: false, email: usuario.email, error };
        }
      });

      const results = await Promise.allSettled(emailPromises);
      
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          if (result.value.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } else {
          errorCount++;
        }
      });

      // Pequeña pausa entre lotes para no sobrecargar el API de Resend
      if (i + batchSize < usuarios.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Registrar notificación en la base de datos
    await prisma.notificacionSistema.create({
      data: {
        titulo: title,
        mensaje: message,
        accionUrl: actionUrl,
        accionTexto: actionText,
        enviadoPorId: session.userId,
        totalEnviados: successCount,
        totalErrores: errorCount,
        fechaEnvio: new Date()
      }
    });

    console.log(`Notificación del sistema enviada: ${successCount} exitosos, ${errorCount} errores`);

    return NextResponse.json({
      message: "Notificación del sistema procesada",
      totalUsuarios: usuarios.length,
      exitosos: successCount,
      errores: errorCount,
      titulo: title
    });

  } catch (error) {
    console.error('Error al enviar notificación del sistema:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
};

export const POST = withCsrf(postHandler);

// GET - Obtener historial de notificaciones del sistema
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session || session.rol !== "ADMIN") {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const [notificaciones, total] = await Promise.all([
      prisma.notificacionSistema.findMany({
        orderBy: { fechaEnvio: 'desc' },
        take: limit,
        skip: offset,
        include: {
          enviadoPor: {
            select: {
              nombre: true,
              email: true
            }
          }
        }
      }),
      prisma.notificacionSistema.count()
    ]);

    return NextResponse.json({
      notificaciones,
      total,
      limit,
      offset
    });

  } catch (error) {
    console.error('Error al obtener notificaciones del sistema:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
