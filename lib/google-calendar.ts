import { google } from "googleapis";

// Integración con el calendario de Google del negocio para que 2GoBot pueda
// agendar citas reales. Usa un OAuth2 refresh token generado una sola vez
// por el dueño del negocio (no hay usuario interactivo en el servidor) en
// vez de una cuenta de servicio, porque el calendario es un Google Calendar
// personal/business normal, no un recurso de Google Workspace.
const CLIENT_ID = process.env.GOOGLE_CALENDAR_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_CALENDAR_REFRESH_TOKEN;
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || "primary";
const TIMEZONE = "America/El_Salvador";

export function isGoogleCalendarConfigured(): boolean {
  return Boolean(CLIENT_ID && CLIENT_SECRET && REFRESH_TOKEN);
}

function getCalendarClient() {
  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
  oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
  return google.calendar({ version: "v3", auth: oauth2Client });
}

export interface FreeSlot {
  inicio: string; // ISO
  fin: string; // ISO
}

/**
 * Busca huecos libres de `duracionMinutos` dentro de horario laboral
 * (lunes a sábado, 8am-5pm hora de El Salvador) en los próximos `diasAdelante` días.
 */
export async function buscarDisponibilidad(
  duracionMinutos: number,
  diasAdelante: number = 7
): Promise<FreeSlot[]> {
  const calendar = getCalendarClient();
  const now = new Date();
  const timeMin = now.toISOString();
  const timeMax = new Date(now.getTime() + diasAdelante * 24 * 60 * 60 * 1000).toISOString();

  const freebusy = await calendar.freebusy.query({
    requestBody: {
      timeMin,
      timeMax,
      timeZone: TIMEZONE,
      items: [{ id: CALENDAR_ID }],
    },
  });

  const busy = (freebusy.data.calendars?.[CALENDAR_ID]?.busy ?? [])
    .filter((b) => b.start && b.end)
    .map((b) => ({ start: new Date(b.start as string), end: new Date(b.end as string) }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const slots: FreeSlot[] = [];
  const durationMs = duracionMinutos * 60 * 1000;

  for (let day = 0; day < diasAdelante && slots.length < 8; day++) {
    const dayDate = new Date(now.getTime() + day * 24 * 60 * 60 * 1000);
    const dowInSV = getDayOfWeekInTimezone(dayDate, TIMEZONE);
    if (dowInSV === 0) continue; // domingo cerrado

    const workStart = atLocalHour(dayDate, TIMEZONE, 8);
    const workEnd = atLocalHour(dayDate, TIMEZONE, 17);

    let cursor = new Date(Math.max(workStart.getTime(), now.getTime()));
    while (cursor.getTime() + durationMs <= workEnd.getTime() && slots.length < 8) {
      const slotEnd = new Date(cursor.getTime() + durationMs);
      const overlaps = busy.some((b) => cursor < b.end && slotEnd > b.start);
      if (!overlaps) {
        slots.push({ inicio: cursor.toISOString(), fin: slotEnd.toISOString() });
        cursor = new Date(cursor.getTime() + durationMs);
      } else {
        const blocking = busy.find((b) => cursor < b.end && slotEnd > b.start)!;
        cursor = new Date(blocking.end.getTime());
      }
    }
  }

  return slots;
}

export interface CrearCitaInput {
  inicio: string; // ISO
  fin: string; // ISO
  nombreContacto: string;
  telefonoContacto: string;
  nombreComercial: string;
  notas: string;
}

export interface CrearCitaResult {
  eventId: string;
  htmlLink: string | null;
}

export async function crearCita(input: CrearCitaInput): Promise<CrearCitaResult> {
  const calendar = getCalendarClient();

  const event = await calendar.events.insert({
    calendarId: CALENDAR_ID,
    requestBody: {
      summary: `2Go — Visita comercial: ${input.nombreComercial}`,
      description: `Lead capturado por 2GoBot.\nContacto: ${input.nombreContacto} (${input.telefonoContacto})\n\n${input.notas}`,
      start: { dateTime: input.inicio, timeZone: TIMEZONE },
      end: { dateTime: input.fin, timeZone: TIMEZONE },
    },
  });

  return {
    eventId: event.data.id || "",
    htmlLink: event.data.htmlLink || null,
  };
}

function getDayOfWeekInTimezone(date: Date, timeZone: string): number {
  const formatted = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(date);
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[formatted] ?? date.getDay();
}

function atLocalHour(date: Date, timeZone: string, hour: number): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "01";
  // Construimos la fecha en UTC ajustando por el offset fijo de El Salvador (UTC-6, sin DST).
  const iso = `${get("year")}-${get("month")}-${get("day")}T${String(hour).padStart(2, "0")}:00:00-06:00`;
  return new Date(iso);
}
