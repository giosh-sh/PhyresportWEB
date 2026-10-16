import type { BookingService, Professional } from "./types";

export interface ParsedQuickSession {
  professionalId?: string;
  serviceId?: string;
  date?: string; // yyyy-mm-dd
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  durationMinutes?: number;
  error?: string;
}

const MONTHS: Record<string, number> = {
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  septiembre: 8,
  setiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11,
};

const WEEKDAYS: Record<string, number> = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function addDaysKey(key: string, days: number): string {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function buildDate(year: number, month: number, day: number): string {
  const d = new Date(Date.UTC(year, month, day));
  return d.toISOString().slice(0, 10);
}

function parseDate(norm: string, todayKey: string): string | null {
  // dd/mm[/yyyy] o dd-mm-yyyy
  const slash = norm.match(/\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\b/);
  if (slash) {
    const day = Number(slash[1]);
    const month = Number(slash[2]) - 1;
    let year = slash[3] ? Number(slash[3]) : Number(todayKey.slice(0, 4));
    if (year < 100) year += 2000;
    if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
      return buildDate(year, month, day);
    }
  }

  // "12 de noviembre [de 2026]"
  const textual = norm.match(/(\d{1,2})\s+de\s+([a-z]+)(?:\s+(?:de\s+)?(\d{4}))?/);
  if (textual && MONTHS[textual[2]] !== undefined) {
    const day = Number(textual[1]);
    const month = MONTHS[textual[2]];
    const year = textual[3] ? Number(textual[3]) : Number(todayKey.slice(0, 4));
    return buildDate(year, month, day);
  }

  if (/pasado\s+manana/.test(norm)) return addDaysKey(todayKey, 2);
  if (/\bmanana\b/.test(norm)) return addDaysKey(todayKey, 1);
  if (/\bhoy\b/.test(norm)) return todayKey;

  // "el lunes", "el proximo martes"...
  for (const [name, idx] of Object.entries(WEEKDAYS)) {
    if (new RegExp(`\\b${name}\\b`).test(norm)) {
      const current = new Date(`${todayKey}T00:00:00Z`).getUTCDay();
      const delta = (idx - current + 7) % 7;
      return addDaysKey(todayKey, delta);
    }
  }

  return null;
}

function parseTime(norm: string): { start?: string; end?: string } {
  // "de 10 a 11", "de 10:00 a 11:30", "desde 9 hasta 10", "10 a 11"
  const range = norm.match(
    /(?:de|desde)?\s*(\d{1,2})(?::(\d{2}))?\s*(?:h|hs|horas)?\s*(?:a|hasta|hasta\s+las|-)\s*(?:las\s+)?(\d{1,2})(?::(\d{2}))?/
  );
  if (range) {
    const sh = Number(range[1]);
    const sm = range[2] ? Number(range[2]) : 0;
    const eh = Number(range[3]);
    const em = range[4] ? Number(range[4]) : 0;
    if (sh <= 23 && eh <= 23) {
      return { start: `${pad2(sh)}:${pad2(sm)}`, end: `${pad2(eh)}:${pad2(em)}` };
    }
  }
  // "a las 10" / "las 10:30"
  const single = norm.match(/(?:a\s+las|las)\s+(\d{1,2})(?::(\d{2}))?/);
  if (single) {
    const h = Number(single[1]);
    const m = single[2] ? Number(single[2]) : 0;
    if (h <= 23) return { start: `${pad2(h)}:${pad2(m)}` };
  }
  return {};
}

function nameWords(name: string): string[] {
  return normalize(name)
    .replace(/[^a-z0-9 ]/g, " ")
    .split(" ")
    .filter((w) => w.length >= 3);
}

function parseProfessional(
  norm: string,
  professionals: Professional[]
): Professional | undefined {
  const inputWords = normalize(norm)
    .replace(/[^a-z0-9 ]/g, " ")
    .split(" ")
    .filter((w) => w.length >= 3);

  let best: Professional | undefined;
  let bestScore = 0;

  for (const p of professionals) {
    const words = nameWords(p.name);
    for (const pw of words) {
      for (const iw of inputWords) {
        // Coincidencia exacta o por prefijo (p. ej. "javi" → "javier").
        if (pw === iw || pw.startsWith(iw) || iw.startsWith(pw)) {
          const score = Math.min(pw.length, iw.length);
          if (score > bestScore) {
            bestScore = score;
            best = p;
          }
        }
      }
    }
  }
  return best;
}

/**
 * Interpreta una frase como "añade una sesión de 10 a 11 con Marichal el 12 de
 * noviembre" y devuelve los datos para crear la cita.
 */
export function parseQuickSession(
  text: string,
  professionals: Professional[],
  services: BookingService[],
  todayKey: string
): ParsedQuickSession {
  const norm = normalize(text);
  if (!norm) return { error: "Escribe qué cita quieres añadir." };

  const professional = parseProfessional(norm, professionals);
  if (!professional) return { error: "No reconozco el profesional. Indica su nombre." };

  const date = parseDate(norm, todayKey);
  if (!date) return { error: "No reconozco la fecha. Escribe, por ejemplo, «el 12 de noviembre»." };

  const { start, end } = parseTime(norm);
  if (!start) return { error: "No reconozco la hora. Prueba «de 10:00 a 11:00»." };

  const service = services[0];
  let endTime = end;
  let durationMinutes: number | undefined;
  if (endTime) {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    durationMinutes = eh * 60 + em - (sh * 60 + sm);
    if (durationMinutes <= 0) durationMinutes += 24 * 60; // cruza medianoche
  } else {
    durationMinutes = service?.duration_minutes ?? 60;
    const [sh, sm] = start.split(":").map(Number);
    const total = sh * 60 + sm + durationMinutes;
    endTime = `${pad2(Math.floor(total / 60) % 24)}:${pad2(total % 60)}`;
  }

  return {
    professionalId: professional.id,
    serviceId: service?.id,
    date,
    startTime: start,
    endTime,
    durationMinutes,
  };
}
