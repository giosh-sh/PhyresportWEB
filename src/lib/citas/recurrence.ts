import { addDays, addMonths } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { CLINIC_TZ, zonedDateTimeToUtc } from "./slots";
import type { TimeOff } from "./types";

function keyToUTC(key: string): Date {
  return new Date(`${key}T00:00:00Z`);
}
function toKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}
function weekdayOfKey(key: string): number {
  return keyToUTC(key).getUTCDay();
}

/**
 * Expande una serie de bloqueo (con recurrencia) a las ocurrencias que caen
 * dentro del rango indicado. Devuelve intervalos en milisegundos (UTC).
 */
export function expandTimeOff(
  series: TimeOff,
  rangeStartMs: number,
  rangeEndMs: number
): { start: number; end: number }[] {
  const startDate = new Date(series.start_at);
  const endDate = new Date(series.end_at);
  const startTime = formatInTimeZone(startDate, CLINIC_TZ, "HH:mm:ss");
  const endTime = formatInTimeZone(endDate, CLINIC_TZ, "HH:mm:ss");
  const baseKey = formatInTimeZone(startDate, CLINIC_TZ, "yyyy-MM-dd");

  const rangeStartKey = formatInTimeZone(new Date(rangeStartMs), CLINIC_TZ, "yyyy-MM-dd");
  const rangeEndKey = formatInTimeZone(new Date(rangeEndMs), CLINIC_TZ, "yyyy-MM-dd");
  const untilKey = series.recurrence_until ? String(series.recurrence_until).slice(0, 10) : null;
  const limitKey = untilKey && untilKey < rangeEndKey ? untilKey : rangeEndKey;

  const freq = series.recurrence || "none";
  const interval = Math.max(1, series.recurrence_interval || 1);
  const occKeys: string[] = [];

  if (freq === "none") {
    occKeys.push(baseKey);
  } else if (freq === "daily") {
    let cursor = baseKey;
    for (let i = 0; i < 1000 && cursor <= limitKey; i++) {
      if (cursor >= rangeStartKey) occKeys.push(cursor);
      cursor = toKey(addDays(keyToUTC(cursor), interval));
    }
  } else if (freq === "weekly") {
    const weekdays =
      series.recurrence_weekdays?.length ? series.recurrence_weekdays : [weekdayOfKey(baseKey)];
    let cursor = baseKey;
    for (let i = 0; i < 2000 && cursor <= limitKey; i++) {
      const diffDays = Math.round(
        (keyToUTC(cursor).getTime() - keyToUTC(baseKey).getTime()) / 86400000
      );
      const diffWeeks = Math.floor(diffDays / 7);
      if (
        cursor >= rangeStartKey &&
        weekdays.includes(weekdayOfKey(cursor)) &&
        diffWeeks % interval === 0
      ) {
        occKeys.push(cursor);
      }
      cursor = toKey(addDays(keyToUTC(cursor), 1));
    }
  } else if (freq === "monthly") {
    let cursor = baseKey;
    for (let i = 0; i < 240 && cursor <= limitKey; i++) {
      if (cursor >= rangeStartKey) occKeys.push(cursor);
      cursor = toKey(addMonths(keyToUTC(cursor), interval));
    }
  }

  return occKeys
    .map((key) => {
      const start = zonedDateTimeToUtc(key, startTime).getTime();
      const end = zonedDateTimeToUtc(key, endTime).getTime();
      return { start, end: end <= start ? start + 86400000 : end };
    })
    .filter((iv) => iv.start < rangeEndMs && iv.end > rangeStartMs);
}

/** Texto legible de la repetición de un bloqueo. */
export function describeRecurrence(series: Pick<TimeOff, "recurrence" | "recurrence_interval" | "recurrence_weekdays" | "recurrence_until">): string {
  if (!series.recurrence || series.recurrence === "none") return "";
  const every = series.recurrence_interval > 1 ? `cada ${series.recurrence_interval} ` : "";
  if (series.recurrence === "daily") return every ? `Cada ${series.recurrence_interval} días` : "Cada día";
  if (series.recurrence === "monthly") return every ? `Cada ${series.recurrence_interval} meses` : "Cada mes";
  // weekly
  const days = (series.recurrence_weekdays ?? [])
    .slice()
    .sort()
    .map((d) => ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][d])
    .join(", ");
  const base = series.recurrence_interval > 1 ? `Cada ${series.recurrence_interval} semanas` : "Semanalmente";
  return days ? `${base} (${days})` : base;
}
