import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Content, FunctionCall } from "@google/genai";
import { prisma } from "@/lib/prisma";
import { withRateLimitAndValidation } from "@/lib/api-helpers";
import { getClientIp } from "@/lib/rate-limit";
import { Chat2GoBotSchema, Chat2GoBotInput } from "@/lib/schemas/chat-2gobot.schemas";
import {
  buscarDisponibilidad,
  crearCita,
  isGoogleCalendarConfigured,
} from "@/lib/google-calendar";

// Endpoint público del landing (widget "2GoBot"): responde SOLO sobre el
// negocio (armado de muebles RTA/melamina para retailers en El Salvador),
// nunca temas generales. Puede agendar una cita real en Google Calendar y,
// al hacerlo, crea el lead como Proyecto (esLead=true) — ver /admin/leads.
//
// Usa Gemini 2.5 Flash-Lite (no Claude/Anthropic) por costo: para el volumen
// de un chat de landing, la capa gratuita de Gemini cubre prácticamente todo
// el uso real, decisión explícita del negocio sobre precio.
const CHAT_RATE_LIMIT = {
  windowMs: 10 * 60 * 1000, // 10 minutos
  maxRequests: 20,
};

const MODEL = "gemini-2.5-flash-lite";

const SYSTEM_PROMPT = `Eres 2GoBot, el asistente virtual de Armados 2Go, una empresa que ofrece
servicio profesional de armado (ensamble) de muebles RTA (Ready To Assemble) y
de melamina para retailers y tiendas en El Salvador que venden ese tipo de
mobiliario a sus clientes finales.

Reglas estrictas:
- SOLO respondes preguntas sobre Armados 2Go: qué servicio ofrecemos, a quién
  (retailers/tiendas de muebles RTA y melamina en El Salvador, no consumidores
  finales individuales), cobertura geográfica (todo El Salvador), cómo funciona
  el servicio (tracking GPS, portal de seguimiento, facturación por proyecto),
  y cómo agendar una cita comercial.
- Si te preguntan algo fuera de este tema (clima, noticias, código, tareas
  personales, opiniones, cualquier otro negocio), responde brevemente que solo
  puedes ayudar con temas de Armados 2Go y redirige la conversación.
- No inventes precios exactos ni compromisos contractuales; para cotizaciones
  específicas, ofrece agendar una cita con el equipo comercial.
- Tu objetivo cuando alguien muestra interés real es agendar una cita comercial
  real usando las herramientas disponibles: primero consulta disponibilidad,
  ofrece 2-3 horarios concretos, y cuando el usuario elija uno, pide su nombre,
  el nombre de su tienda/negocio y un teléfono de contacto antes de agendar.
- Sé breve, cordial y profesional. Responde en español salvadoreño neutro.`;

const TOOLS = [
  {
    functionDeclarations: [
      {
        name: "consultar_disponibilidad",
        description:
          "Consulta horarios disponibles en el calendario del equipo comercial para agendar una visita/llamada. Úsalo antes de ofrecer horarios al usuario.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            duracion_minutos: {
              type: "number",
              description: "Duración deseada de la cita en minutos (usualmente 30).",
            },
          },
          required: ["duracion_minutos"],
        },
      },
      {
        name: "agendar_cita",
        description:
          "Agenda una cita comercial real en el calendario del equipo, usando un horario previamente ofrecido por consultar_disponibilidad, y registra el lead en el sistema.",
        parametersJsonSchema: {
          type: "object",
          properties: {
            inicio: { type: "string", description: "Fecha/hora ISO 8601 de inicio, tal como la devolvió consultar_disponibilidad." },
            fin: { type: "string", description: "Fecha/hora ISO 8601 de fin, tal como la devolvió consultar_disponibilidad." },
            nombre_contacto: { type: "string", description: "Nombre de la persona de contacto." },
            telefono_contacto: { type: "string", description: "Teléfono de contacto." },
            nombre_comercial: { type: "string", description: "Nombre de la tienda/retailer interesado." },
            notas: { type: "string", description: "Resumen de lo que el cliente necesita." },
          },
          required: ["inicio", "fin", "nombre_contacto", "telefono_contacto", "nombre_comercial", "notas"],
        },
      },
    ],
  },
];

async function ejecutarConsultarDisponibilidad(input: { duracion_minutos?: number }) {
  if (!isGoogleCalendarConfigured()) {
    return {
      disponible: false,
      mensaje:
        "El calendario no está disponible en este momento. Pide el nombre, negocio y teléfono del usuario para que el equipo lo contacte directamente.",
    };
  }
  const duracion = input.duracion_minutos && input.duracion_minutos > 0 ? input.duracion_minutos : 30;
  const slots = await buscarDisponibilidad(duracion, 7);
  return { disponible: true, horarios: slots };
}

async function ejecutarAgendarCita(input: {
  inicio: string;
  fin: string;
  nombre_contacto: string;
  telefono_contacto: string;
  nombre_comercial: string;
  notas: string;
}) {
  let googleCalendarEventId: string | null = null;

  if (isGoogleCalendarConfigured()) {
    try {
      const cita = await crearCita({
        inicio: input.inicio,
        fin: input.fin,
        nombreContacto: input.nombre_contacto,
        telefonoContacto: input.telefono_contacto,
        nombreComercial: input.nombre_comercial,
        notas: input.notas,
      });
      googleCalendarEventId = cita.eventId;
    } catch (error) {
      console.error("Error creando cita en Google Calendar:", error);
    }
  }

  const proyecto = await prisma.proyecto.create({
    data: {
      nombreComercial: input.nombre_comercial,
      activo: false,
      tipoCliente: "CONSUMIDOR_FINAL",
      datosFacturacion: {},
      esLead: true,
      estadoLead: "NUEVO",
      notasLead: input.notas,
      contactoLead: {
        nombre: input.nombre_contacto,
        telefono: input.telefono_contacto,
      },
      citaProgramadaEn: googleCalendarEventId ? new Date(input.inicio) : null,
      googleCalendarEventId,
    },
  });

  return {
    confirmado: true,
    citaAgendada: Boolean(googleCalendarEventId),
    leadId: proyecto.id,
    mensaje: googleCalendarEventId
      ? "Cita agendada correctamente en el calendario del equipo."
      : "No se pudo confirmar la cita en el calendario, pero el lead quedó registrado para que el equipo lo contacte.",
  };
}

async function ejecutarHerramienta(nombre: string, input: unknown) {
  switch (nombre) {
    case "consultar_disponibilidad":
      return ejecutarConsultarDisponibilidad(input as { duracion_minutos?: number });
    case "agendar_cita":
      return ejecutarAgendarCita(
        input as {
          inicio: string;
          fin: string;
          nombre_contacto: string;
          telefono_contacto: string;
          nombre_comercial: string;
          notas: string;
        }
      );
    default:
      return { error: `Herramienta desconocida: ${nombre}` };
  }
}

const chatHandler = async (data: Chat2GoBotInput) => {
  const ai = new GoogleGenAI({});

  const contents: Content[] = [
    ...(data.historial ?? []).map((m): Content => ({
      role: m.rol === "usuario" ? "user" : "model",
      parts: [{ text: m.texto }],
    })),
    { role: "user", parts: [{ text: data.mensaje }] },
  ];

  const MAX_ITERATIONS = 4;

  try {
    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          tools: TOOLS,
        },
      });

      const functionCalls: FunctionCall[] = response.functionCalls ?? [];

      if (functionCalls.length === 0) {
        return NextResponse.json({ respuesta: response.text ?? "" });
      }

      const modelContent = response.candidates?.[0]?.content;
      contents.push(modelContent ?? { role: "model", parts: [] });

      const responseParts = [];
      for (const call of functionCalls) {
        const resultado = await ejecutarHerramienta(call.name ?? "", call.args ?? {});
        responseParts.push({
          functionResponse: {
            name: call.name,
            response: resultado as Record<string, unknown>,
          },
        });
      }
      contents.push({ role: "user", parts: responseParts });
    }

    return NextResponse.json({
      respuesta: "Dame un momento, tengo demasiada información que procesar. ¿Podrías repetir tu última pregunta?",
    });
  } catch (error) {
    console.error("Error inesperado en 2GoBot:", error);
    return NextResponse.json(
      { error: "No pudimos procesar tu mensaje. Intenta de nuevo en unos momentos." },
      { status: 500 }
    );
  }
};

export const POST = withRateLimitAndValidation(
  Chat2GoBotSchema,
  CHAT_RATE_LIMIT,
  (request: NextRequest) => `chat-2gobot:${getClientIp(request)}`,
  chatHandler
);
