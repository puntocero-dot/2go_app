import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// ============================================
// NOTIFICACIONES POR EMAIL
// ============================================

export async function enviarEmailOrdenAsignada(data: {
  armadorEmail: string;
  armadorNombre: string;
  ordenCodigo: string;
  clienteNombre: string;
  clienteDireccion: string;
  clienteMunicipio: string;
}) {
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "noreply@armados2go.com",
      to: data.armadorEmail,
      subject: `Nueva Orden Asignada: ${data.ordenCodigo}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0891b2;">¡Nueva Orden Asignada!</h2>
          
          <p>Hola <strong>${data.armadorNombre}</strong>,</p>
          
          <p>Se te ha asignado una nueva orden de armado:</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Código:</strong> ${data.ordenCodigo}</p>
            <p><strong>Cliente:</strong> ${data.clienteNombre}</p>
            <p><strong>Dirección:</strong> ${data.clienteDireccion}</p>
            <p><strong>Municipio:</strong> ${data.clienteMunicipio}</p>
          </div>
          
          <p>Por favor, revisa los detalles completos en la aplicación.</p>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Armados 2Go - Sistema de Gestión de Armado de Muebles
          </p>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Error enviando email:", error);
    return { success: false, error };
  }
}

export async function enviarEmailCambioEstado(data: {
  clienteEmail: string;
  clienteNombre: string;
  ordenCodigo: string;
  estadoAnterior: string;
  estadoNuevo: string;
  linkSeguimiento: string;
}) {
  try {
    const estadosAmigables: Record<string, string> = {
      SIN_ASIGNAR: "Sin Asignar",
      ASIGNADO: "Asignado a Armador",
      EN_RUTA: "Armador en Camino",
      ARMADO_INICIADO: "Armado Iniciado",
      ARMADO_FINALIZADO: "Armado Finalizado",
      ARMADO_COMPLETADO: "Armado Completado",
    };

    await resend.emails.send({
      from: process.env.EMAIL_FROM || "noreply@armados2go.com",
      to: data.clienteEmail,
      subject: `Actualización de tu Orden ${data.ordenCodigo}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0891b2;">Actualización de tu Orden</h2>
          
          <p>Hola <strong>${data.clienteNombre}</strong>,</p>
          
          <p>Tu orden <strong>${data.ordenCodigo}</strong> ha sido actualizada:</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Estado Anterior:</strong> ${estadosAmigables[data.estadoAnterior] || data.estadoAnterior}</p>
            <p><strong>Estado Actual:</strong> <span style="color: #0891b2; font-weight: bold;">${estadosAmigables[data.estadoNuevo] || data.estadoNuevo}</span></p>
          </div>
          
          <p>
            <a href="${data.linkSeguimiento}" 
               style="display: inline-block; background: #0891b2; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; margin-top: 10px;">
              Ver Estado de mi Orden
            </a>
          </p>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Armados 2Go - Sistema de Gestión de Armado de Muebles
          </p>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Error enviando email:", error);
    return { success: false, error };
  }
}

// ============================================
// NOTIFICACIONES POR WHATSAPP (TWILIO)
// ============================================

export async function enviarWhatsAppOrdenAsignada(data: {
  armadorTelefono: string;
  armadorNombre: string;
  ordenCodigo: string;
  clienteNombre: string;
  clienteDireccion: string;
}) {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_WHATSAPP_FROM;

    if (!accountSid || !authToken || !from) {
      console.warn("Credenciales de Twilio no configuradas");
      return { success: false, error: "Twilio no configurado" };
    }

    // Formatear teléfono (debe incluir código de país)
    const to = `whatsapp:${data.armadorTelefono}`;

    const mensaje = `
🔔 *Nueva Orden Asignada*

Hola ${data.armadorNombre},

Se te ha asignado una nueva orden:

📦 *Código:* ${data.ordenCodigo}
👤 *Cliente:* ${data.clienteNombre}
📍 *Dirección:* ${data.clienteDireccion}

Por favor, revisa los detalles en la app.

_Armados 2Go_
    `.trim();

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: from,
          To: to,
          Body: mensaje,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Twilio error: ${response.statusText}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error enviando WhatsApp:", error);
    return { success: false, error };
  }
}

export async function enviarWhatsAppCambioEstado(data: {
  clienteTelefono: string;
  clienteNombre: string;
  ordenCodigo: string;
  estadoNuevo: string;
  linkSeguimiento: string;
}) {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_WHATSAPP_FROM;

    if (!accountSid || !authToken || !from) {
      console.warn("Credenciales de Twilio no configuradas");
      return { success: false, error: "Twilio no configurado" };
    }

    const to = `whatsapp:${data.clienteTelefono}`;

    const estadosEmoji: Record<string, string> = {
      SIN_ASIGNAR: "⏳",
      ASIGNADO: "✅",
      EN_RUTA: "🚗",
      ARMADO_INICIADO: "🔧",
      ARMADO_FINALIZADO: "✨",
      ARMADO_COMPLETADO: "🎉",
    };

    const emoji = estadosEmoji[data.estadoNuevo] || "📦";

    const mensaje = `
${emoji} *Actualización de tu Orden*

Hola ${data.clienteNombre},

Tu orden *${data.ordenCodigo}* ha sido actualizada:

*Estado:* ${data.estadoNuevo.replace(/_/g, " ")}

Puedes ver el estado completo aquí:
${data.linkSeguimiento}

_Armados 2Go_
    `.trim();

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: from,
          To: to,
          Body: mensaje,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Twilio error: ${response.statusText}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error enviando WhatsApp:", error);
    return { success: false, error };
  }
}

// ============================================
// FUNCIÓN PRINCIPAL DE NOTIFICACIÓN
// ============================================

export async function notificarCambioEstadoOrden(ordenId: string) {
  try {
    const { prisma } = await import("./prisma");

    const orden = await prisma.orden.findUnique({
      where: { id: ordenId },
      include: {
        usuarioFinal: true,
        armador: {
          include: {
            usuario: true,
          },
        },
        registrosEstado: {
          orderBy: { timestamp: "desc" },
          take: 1,
        },
      },
    });

    if (!orden) {
      return { success: false, error: "Orden no encontrada" };
    }

    const ultimoRegistro = orden.registrosEstado[0];
    const linkSeguimiento = `${process.env.NEXT_PUBLIC_APP_URL}/seguimiento/${orden.id}`;

    // Notificar al cliente si tiene email o teléfono
    if (orden.usuarioFinal.email) {
      await enviarEmailCambioEstado({
        clienteEmail: orden.usuarioFinal.email,
        clienteNombre: orden.usuarioFinal.nombre,
        ordenCodigo: orden.codigoReferenciaRetail,
        estadoAnterior: ultimoRegistro?.estadoAnterior || "SIN_ASIGNAR",
        estadoNuevo: orden.estado,
        linkSeguimiento,
      });
    }

    if (orden.usuarioFinal.telefono) {
      await enviarWhatsAppCambioEstado({
        clienteTelefono: orden.usuarioFinal.telefono,
        clienteNombre: orden.usuarioFinal.nombre,
        ordenCodigo: orden.codigoReferenciaRetail,
        estadoNuevo: orden.estado,
        linkSeguimiento,
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error en notificación:", error);
    return { success: false, error };
  }
}