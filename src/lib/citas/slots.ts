import { fromZonedTime } from "date-fns-tz";
import type { Availability, DaySlot, Slot, TimeOff } from "./types";

/** Zona horaria del centro (Santa Cruz de Tenerife). */
export const CLINIC_TZ = "Atlantic/Canary";

/** Granularidad de las franjas ofertadas, en minutos. */
export const SLOT_STEP_MINUTES = 15;

export interface Interval {
  start: number;
  end: number;
}

export function overlaps(a: Interval, b: Interval): boolean {
  return a.start < b.end && a.end > b.start;
}

export function overlapsAny(interval: Interval, busy: Interval[]): boolean {
  return busy.some((b) => overlaps(interval, b));
}

/** Día de la semana (0 = domingo) de una fecha "YYYY-MM-DD" sin desfases de zona. */
export function weekdayOf(dateStr: string): number {
  return new Date(`${dateStr}T00:00:00Z`).getUTCDay();
}

/** Convierte una hora de pared (dateStr + "HH:MM") en la zona del centro a instante UTC. */
export function zonedDateTimeToUtc(dateStr: string, time: string): Date {
  const hhmm = time.length === 5 ? `${time}:00` : time;
  return fromZonedTime(`${dateStr}T${hhmm}`, CLINIC_TZ);
}

/** "YYYY-MM-DD" del instante dado en la zona del centro. */
export function dateKeyInTz(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CLINIC_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Ventanas de disponibilidad aplicables (por profesional) para un día concreto. */
export function availabilityWindowsFor(
  availability: Availability[],
  professionalId: string,
  weekday: number
): { start: string; end: string }[] {
  return availability
    .filter((a) => a.professional_id === professionalId && a.active && a.weekday === weekday)
    .map((a) => ({ start: a.start_time, end: a.end_time }));
}

/**
 * Genera TODAS las franjas del día dentro del horario de los profesionales,
 * marcando cuáles están libres y cuáles ocupadas/bloqueadas. Así el wizard
 * público puede mostrar también las horas no disponibles (en rojo).
 */
export interface DaySlotsParams {
  date: string;
  durationMinutes: number;
  professionalIds: string[];
  availability: Availability[];
  appointments: { professional_id: string | null; start_at: string; end_at: string }[];
  timeOff: TimeOff[];
  stepMinutes?: number;
  /** Días de la semana (0=domingo) en que el centro está cerrado. */
  closedWeekdays?: number[];
}

export function computeDaySlotGrid(params: DaySlotsParams): DaySlot[] {
  const {
    date,
    durationMinutes,
    professionalIds,
    availability,
    appointments,
    timeOff,
    stepMinutes = SLOT_STEP_MINUTES,
    closedWeekdays,
  } = params;

  const weekday = weekdayOf(date);

  // Centro cerrado ese día (p. ej. fines de semana): no hay franjas que mostrar.
  if (closedWeekdays && closedWeekdays.includes(weekday)) return [];

  const stepMs = stepMinutes * 60_000;
  const durationMs = durationMinutes * 60_000;

  // Horas de inicio que existen dentro de algún horario + profesionales libres.
  const candidateStarts = new Set<string>();
  const freeByStart = new Map<string, Set<string>>();

  for (const proId of professionalIds) {
    const windows = availabilityWindowsFor(availability, proId, weekday);
    if (windows.length === 0) continue;

    const busy: Interval[] = [];
    for (const appt of appointments) {
      if (appt.professional_id !== proId) continue;
      busy.push({ start: new Date(appt.start_at).getTime(), end: new Date(appt.end_at).getTime() });
    }
    for (const off of timeOff) {
      if (off.professional_id && off.professional_id !== proId) continue;
      busy.push({ start: new Date(off.start_at).getTime(), end: new Date(off.end_at).getTime() });
    }
    busy.sort((a, b) => a.start - b.start);

    for (const w of windows) {
      const winStart = zonedDateTimeToUtc(date, w.start).getTime();
      const winEnd = zonedDateTimeToUtc(date, w.end).getTime();
      if (winEnd <= winStart) continue;

      for (let s = winStart; s + durationMs <= winEnd; s += stepMs) {
        const iso = new Date(s).toISOString();
        candidateStarts.add(iso);
        if (overlapsAny({ start: s, end: s + durationMs }, busy)) continue;
        if (!freeByStart.has(iso)) freeByStart.set(iso, new Set());
        freeByStart.get(iso)!.add(proId);
      }
    }
  }

  return Array.from(candidateStarts)
    .map((start) => {
      const ids = Array.from(freeByStart.get(start) ?? []);
      return {
        start,
        end: new Date(new Date(start).getTime() + durationMs).toISOString(),
        professionalIds: ids,
        available: ids.length > 0,
      };
    })
    .sort((a, b) => a.start.localeCompare(b.start));
}

/**
 * Genera las franjas libres para uno o varios profesionales en un día.
 * @returns Slots ordenados con los ids de los profesionales libres en cada uno.
 */
export function computeDaySlots(params: DaySlotsParams): Slot[] {
  return computeDaySlotGrid(params).filter((slot) => slot.available);
}

/**
 * Asignación equilibrada: de entre los profesionales libres en una franja,
 * elige el que menos citas tiene ese día (empate → menor sort_order / orden dado).
 */
export function pickBalancedProfessional(
  candidateIds: string[],
  appointmentsThatDay: { professional_id: string | null }[],
  order: string[] = []
): string | null {
  if (candidateIds.length === 0) return null;
  const load = new Map<string, number>();
  for (const id of candidateIds) load.set(id, 0);
  for (const appt of appointmentsThatDay) {
    if (appt.professional_id && load.has(appt.professional_id)) {
      load.set(appt.professional_id, (load.get(appt.professional_id) ?? 0) + 1);
    }
  }
  const rank = (id: string) => {
    const idx = order.indexOf(id);
    return idx === -1 ? 999 : idx;
  };
  return [...candidateIds].sort((a, b) => {
    const diff = (load.get(a) ?? 0) - (load.get(b) ?? 0);
    if (diff !== 0) return diff;
    return rank(a) - rank(b);
  })[0];
}
