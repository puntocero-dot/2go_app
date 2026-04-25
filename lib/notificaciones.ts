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
      html: `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: Arial, Helvetica, sans-serif;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 24px 16px;">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden;">
          <tr>
            <td style="background-color: #0891b2; padding: 28px 32px; text-align: center;">
              <table cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td style="width: 36px; height: 36px; background-color: rgba(255,255,255,0.2); border-radius: 8px; text-align: center; line-height: 36px; font-size: 20px; color: #ffffff;">&#128230;</td>
                  <td style="padding-left: 12px; font-size: 22px; font-weight: 700; color: #ffffff; font-family: Arial, sans-serif;">Armados 2Go</td>
                </tr>
              </table>
              <p style="margin: 12px 0 0; font-size: 16px; color: rgba(255,255,255,0.9); font-family: Arial, sans-serif;">Nueva Orden Asignada</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 28px 32px; font-family: Arial, sans-serif;">
              <p style="margin: 0 0 12px; font-size: 16px; color: #374151;">Hola <strong>${data.armadorNombre}</strong>,</p>
              <p style="margin: 0 0 20px; font-size: 14px; color: #6b7280;">Se te ha asignado una nueva orden de armado:</p>
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
                <tr><td style="padding: 14px 20px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280; width: 100px;">C&oacute;digo</td><td style="padding: 14px 20px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #111827; font-weight: 600;">${data.ordenCodigo}</td></tr>
                <tr><td style="padding: 14px 20px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280;">Cliente</td><td style="padding: 14px 20px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #111827;">${data.clienteNombre}</td></tr>
                <tr><td style="padding: 14px 20px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280;">Direcci&oacute;n</td><td style="padding: 14px 20px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #111827;">${data.clienteDireccion}</td></tr>
                <tr><td style="padding: 14px 20px; font-size: 13px; color: #6b7280;">Municipio</td><td style="padding: 14px 20px; font-size: 14px; color: #111827;">${data.clienteMunicipio}</td></tr>
              </table>
              <p style="margin: 20px 0 0; font-size: 14px; color: #6b7280;">Por favor, revisa los detalles completos en la aplicaci&oacute;n.</p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; border-top: 1px solid #e5e7eb; padding: 20px 32px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af; font-family: Arial, sans-serif;">&copy; ${new Date().getFullYear()} Armados 2Go</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
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
  etaMinutos?: number | null;
  etaHoraLlegada?: string | null;
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

    const estadosStepper = [
      "ASIGNADO",
      "EN_RUTA",
      "ARMADO_INICIADO",
      "ARMADO_COMPLETADO",
    ];

    const stepLabels = [
      "Asignado",
      "En Camino",
      "Armado",
      "Completado",
    ];

    let estadoParaStepper = data.estadoNuevo;
    if (estadoParaStepper === "ARMADO_FINALIZADO") {
      estadoParaStepper = "ARMADO_COMPLETADO";
    }

    const currentIndex = estadosStepper.indexOf(estadoParaStepper);

    // Build table-based stepper (compatible with all email clients)
    const stepperCells = estadosStepper
      .map((_, index) => {
        const isCompleted = currentIndex > index;
        const isActive = currentIndex === index;

        const circleBg = isActive ? "#0891b2" : isCompleted ? "#10b981" : "#e5e7eb";
        const circleText = isActive || isCompleted ? "#ffffff" : "#9ca3af";
        const labelColor = isActive ? "#0891b2" : isCompleted ? "#10b981" : "#9ca3af";
        const labelWeight = isActive ? "bold" : "normal";

        return `<td style="text-align: center; vertical-align: top; padding: 0 4px; width: 25%;">
          <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto;">
            <tr>
              <td style="width: 36px; height: 36px; border-radius: 50%; background-color: ${circleBg}; color: ${circleText}; text-align: center; font-size: 14px; font-weight: 700; line-height: 36px; font-family: Arial, sans-serif;">
                ${isCompleted ? "&#10003;" : index + 1}
              </td>
            </tr>
          </table>
          <p style="margin: 8px 0 0; font-size: 11px; color: ${labelColor}; font-weight: ${labelWeight}; line-height: 1.3; font-family: Arial, sans-serif;">
            ${stepLabels[index]}
          </p>
        </td>`;
      })
      .join("");

    // Connector lines between steps
    const connectorCells = estadosStepper
      .map((_, index) => {
        if (index >= estadosStepper.length - 1) return "";
        // Each step takes ~25% width. We use colspan tricks via padding.
        return "";
      })
      .join("");
    void connectorCells; // lines drawn inside step cells via borders

    // ETA section for EN_RUTA
    const etaSection = data.estadoNuevo === "EN_RUTA" && data.etaMinutos
      ? `<tr>
          <td style="padding: 0 32px 24px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #ecfdf5; border-radius: 8px; border: 1px solid #d1fae5;">
              <tr>
                <td style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
                  <p style="margin: 0 0 4px; font-size: 12px; color: #065f46; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Llegada estimada</p>
                  <p style="margin: 0; font-size: 32px; font-weight: 700; color: #059669;">~${data.etaMinutos} min</p>
                  ${data.etaHoraLlegada ? `<p style="margin: 6px 0 0; font-size: 14px; color: #047857;">Hora aprox: ${data.etaHoraLlegada}</p>` : ""}
                </td>
              </tr>
            </table>
          </td>
        </tr>`
      : "";

    await resend.emails.send({
      from: process.env.EMAIL_FROM || "noreply@armados2go.com",
      to: data.clienteEmail,
      subject: `${data.estadoNuevo === "ARMADO_COMPLETADO" ? "&#127881; " : ""}Actualización de tu Orden ${data.ordenCodigo}`,
      html: `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: Arial, Helvetica, sans-serif;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 24px 16px;">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background-color: #0891b2; padding: 28px 32px; text-align: center;">
              <table cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td style="width: 36px; height: 36px; background-color: rgba(255,255,255,0.2); border-radius: 8px; text-align: center; line-height: 36px; font-size: 20px; color: #ffffff;">
                    &#128230;
                  </td>
                  <td style="padding-left: 12px; font-size: 22px; font-weight: 700; color: #ffffff; font-family: Arial, sans-serif;">
                    Armados 2Go
                  </td>
                </tr>
              </table>
              <p style="margin: 12px 0 0; font-size: 16px; color: rgba(255,255,255,0.9); font-family: Arial, sans-serif;">
                Actualización de tu orden
              </p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 28px 32px 16px; font-family: Arial, sans-serif;">
              <p style="margin: 0; font-size: 16px; color: #374151;">
                Hola <strong style="color: #111827;">${data.clienteNombre}</strong>,
              </p>
              <p style="margin: 8px 0 0; font-size: 14px; color: #6b7280;">
                Tu orden <strong style="color: #111827;">${data.ordenCodigo}</strong> ha sido actualizada.
              </p>
            </td>
          </tr>

          <!-- Status Change Box -->
          <tr>
            <td style="padding: 0 32px 20px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f0fdfa; border-radius: 8px; border: 1px solid #ccfbf1;">
                <tr>
                  <td style="padding: 16px 20px; font-family: Arial, sans-serif;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="font-size: 13px; color: #6b7280; padding-bottom: 6px;">Estado anterior:</td>
                        <td style="font-size: 13px; color: #374151; font-weight: 600; text-align: right; padding-bottom: 6px;">${estadosAmigables[data.estadoAnterior] || data.estadoAnterior}</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="border-top: 1px solid #e5e7eb; padding-top: 6px;"></td>
                      </tr>
                      <tr>
                        <td style="font-size: 13px; color: #6b7280; padding-top: 2px;">Estado actual:</td>
                        <td style="font-size: 14px; color: #0891b2; font-weight: 700; text-align: right; padding-top: 2px;">${estadosAmigables[data.estadoNuevo] || data.estadoNuevo}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ETA Section (only for EN_RUTA) -->
          ${etaSection}

          <!-- Stepper -->
          <tr>
            <td style="padding: 0 32px 8px;">
              <p style="margin: 0; font-size: 13px; color: #6b7280; font-family: Arial, sans-serif; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
                Progreso del servicio
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 24px 28px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  ${stepperCells}
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 32px 28px; text-align: center;">
              <table cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td style="background-color: #0891b2; border-radius: 8px;">
                    <a href="${data.linkSeguimiento}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; font-family: Arial, sans-serif; letter-spacing: 0.3px;">
                      Ver Estado en Tiempo Real &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; border-top: 1px solid #e5e7eb; padding: 20px 32px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af; font-family: Arial, sans-serif;">
                &copy; ${new Date().getFullYear()} Armados 2Go &mdash; Sistema de Gesti&oacute;n de Armado de Muebles
              </p>
              <p style="margin: 6px 0 0; font-size: 11px; color: #d1d5db; font-family: Arial, sans-serif;">
                Este correo fue enviado autom&aacute;ticamente. No respondas a este mensaje.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
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
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.armados2go.com";
    const linkSeguimiento = `${baseUrl}/seguimiento/${orden.id}?token=${encodeURIComponent(orden.linkMagicoToken)}`;

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