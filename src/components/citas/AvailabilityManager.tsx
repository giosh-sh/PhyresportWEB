"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarOff, Loader2, Plus, Repeat, Save, Trash2 } from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CLINIC_TZ, zonedDateTimeToUtc } from "@/lib/citas/slots";
import { describeRecurrence } from "@/lib/citas/recurrence";
import {
  RECURRENCE_OPTIONS,
  WEEKDAY_SHORT,
  type Professional,
  type RecurrenceFreq,
  type TimeOff,
} from "@/lib/citas/types";
import {
  addTimeOff,
  deleteTimeOff,
  getAvailability,
  getTimeOffSeries,
  saveAvailability,
} from "@/lib/citas/actions";

const WEEKDAYS = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
];

interface Row {
  weekday: number;
  start_time: string;
  end_time: string;
}

/** Fecha de "repetir hasta" por defecto (3 meses). */
function defaultUntil(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 3);
  return d.toISOString().slice(0, 10);
}

export function AvailabilityManager({
  professionals,
  lockedProfessionalId,
}: {
  professionals: Professional[];
  lockedProfessionalId?: string | null;
}) {
  const [professionalId, setProfessionalId] = useState(
    lockedProfessionalId || professionals[0]?.id || ""
  );
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [timeOff, setTimeOff] = useState<TimeOff[]>([]);
  const [offPro, setOffPro] = useState<string>(lockedProfessionalId || "");
  const [offStart, setOffStart] = useState("");
  const [offEnd, setOffEnd] = useState("");
  const [offAllDay, setOffAllDay] = useState(false);
  const [offReason, setOffReason] = useState("");
  const [offFreq, setOffFreq] = useState<RecurrenceFreq>("none");
  const [offWeekdays, setOffWeekdays] = useState<number[]>([]);
  const [offUntil, setOffUntil] = useState("");

  const loadAvailability = useCallback(async (pid: string) => {
    if (!pid) return;
    setLoading(true);
    const data = await getAvailability(pid);
    setRows(
      data.map((a) => ({ weekday: a.weekday, start_time: a.start_time.slice(0, 5), end_time: a.end_time.slice(0, 5) }))
    );
    setLoading(false);
  }, []);

  const loadTimeOff = useCallback(async () => {
    setTimeOff(await getTimeOffSeries());
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga al cambiar de profesional
    loadAvailability(professionalId);
  }, [professionalId, loadAvailability]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount
    loadTimeOff();
  }, [loadTimeOff]);

  function addRow(weekday: number) {
    setRows((r) => [...r, { weekday, start_time: "10:00", end_time: "21:00" }]);
  }
  function updateRow(index: number, patch: Partial<Row>) {
    setRows((r) => r.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }
  function removeRow(index: number) {
    setRows((r) => r.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaving(true);
    const res = await saveAvailability(professionalId, rows);
    setSaving(false);
    if (res.error) return toast.error(res.error);
    toast.success("Horario guardado");
  }

  function toggleWeekday(day: number) {
    setOffWeekdays((w) => (w.includes(day) ? w.filter((d) => d !== day) : [...w, day]));
  }

  function applyPreset(preset: "weekend" | "weekdays" | "daily") {
    if (preset === "daily") {
      setOffFreq("daily");
      setOffWeekdays([]);
    } else if (preset === "weekend") {
      setOffFreq("weekly");
      setOffWeekdays([0, 6]);
    } else {
      setOffFreq("weekly");
      setOffWeekdays([1, 2, 3, 4, 5]);
    }
    // Rellena "repetir hasta" si está vacío para no bloquear el guardado.
    setOffUntil((u) => u || defaultUntil());
  }

  async function handleAddTimeOff() {
    if (!offStart) return toast.error("Indica la fecha y hora de inicio");

    let startISO: string;
    let endISO: string;
    if (offAllDay) {
      const day = offStart.slice(0, 10);
      startISO = zonedDateTimeToUtc(day, "00:00").toISOString();
      endISO = zonedDateTimeToUtc(day, "23:59").toISOString();
    } else {
      if (!offEnd) return toast.error("Indica fecha y hora de fin");
      const [sd, st] = offStart.split("T");
      const [ed, et] = offEnd.split("T");
      startISO = zonedDateTimeToUtc(sd, st).toISOString();
      endISO = zonedDateTimeToUtc(ed, et).toISOString();
      if (new Date(endISO) <= new Date(startISO)) {
        return toast.error("El fin debe ser posterior al inicio");
      }
    }

    if (offFreq === "weekly" && offWeekdays.length === 0) {
      return toast.error("Selecciona al menos un día para la repetición semanal");
    }

    const until = offFreq === "none" ? null : offUntil || defaultUntil();

    const res = await addTimeOff({
      professionalId: offPro || null,
      startISO,
      endISO,
      allDay: offAllDay,
      reason: offReason,
      recurrence: offFreq,
      recurrenceInterval: 1,
      recurrenceWeekdays: offFreq === "weekly" ? offWeekdays : [],
      recurrenceUntil: until,
    });
    if (res.error) return toast.error(res.error);
    toast.success("Bloqueo añadido");
    setOffStart("");
    setOffEnd("");
    setOffReason("");
    setOffFreq("none");
    setOffWeekdays([]);
    setOffUntil("");
    setOffAllDay(false);
    loadTimeOff();
  }

  async function handleDeleteTimeOff(id: string) {
    const res = await deleteTimeOff(id);
    if (res.error) return toast.error(res.error);
    setTimeOff((t) => t.filter((x) => x.id !== id));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Horario semanal */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold text-navy">Horario semanal</h2>
          {!lockedProfessionalId && (
            <select
              value={professionalId}
              onChange={(e) => setProfessionalId(e.target.value)}
              className="h-9 rounded-md border border-gray-200 px-2 text-sm"
            >
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {loading ? (
          <div className="flex items-center gap-2 py-8 text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
          </div>
        ) : (
          <div className="space-y-4">
            {WEEKDAYS.map((day) => {
              const dayRows = rows
                .map((r, i) => ({ ...r, index: i }))
                .filter((r) => r.weekday === day.value);
              return (
                <div key={day.value} className="rounded-lg border border-gray-100 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-navy">{day.label}</span>
                    <button
                      type="button"
                      onClick={() => addRow(day.value)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-teal hover:text-cyan"
                    >
                      <Plus className="h-3.5 w-3.5" /> Añadir franja
                    </button>
                  </div>
                  {dayRows.length === 0 ? (
                    <p className="mt-1 text-xs text-gray-400">Cerrado</p>
                  ) : (
                    <div className="mt-2 space-y-2">
                      {dayRows.map((row) => (
                        <div key={row.index} className="flex items-center gap-2">
                          <input
                            type="time"
                            step={900}
                            value={row.start_time}
                            onChange={(e) => updateRow(row.index, { start_time: e.target.value })}
                            className="h-8 rounded border border-gray-200 px-2 text-sm"
                          />
                          <span className="text-gray-400">–</span>
                          <input
                            type="time"
                            step={900}
                            value={row.end_time}
                            onChange={(e) => updateRow(row.index, { end_time: e.target.value })}
                            className="h-8 rounded border border-gray-200 px-2 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => removeRow(row.index)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
              Guardar horario
            </Button>
          </div>
        )}
      </div>

      {/* Bloqueos */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-navy">
          <CalendarOff className="h-5 w-5 text-teal" /> Bloqueos y ausencias
        </h2>

        <div className="space-y-3 rounded-lg border border-gray-100 p-3">
          {!lockedProfessionalId && (
            <div>
              <Label className="text-xs">Profesional</Label>
              <select
                value={offPro}
                onChange={(e) => setOffPro(e.target.value)}
                className="mt-1 h-9 w-full rounded-md border border-gray-200 px-2 text-sm"
              >
                <option value="">Todo el centro</option>
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Desde</Label>
              <Input
                type="datetime-local"
                value={offStart}
                onChange={(e) => setOffStart(e.target.value)}
                className="mt-1 h-9"
              />
            </div>
            <div>
              <Label className="text-xs">Hasta</Label>
              <Input
                type="datetime-local"
                value={offEnd}
                disabled={offAllDay}
                onChange={(e) => setOffEnd(e.target.value)}
                className="mt-1 h-9"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={offAllDay} onChange={(e) => setOffAllDay(e.target.checked)} />
            Todo el día
          </label>

          <div>
            <Label className="text-xs">Motivo</Label>
            <Input
              value={offReason}
              onChange={(e) => setOffReason(e.target.value)}
              placeholder="Vacaciones, descanso, urgencia…"
              className="mt-1 h-9"
            />
          </div>

          {/* Repetición */}
          <div className="rounded-lg bg-ice/50 p-3">
            <Label className="flex items-center gap-1.5 text-xs font-semibold text-navy">
              <Repeat className="h-3.5 w-3.5" /> Repetición
            </Label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button type="button" onClick={() => applyPreset("weekend")} className="rounded-full border border-gray-200 px-2.5 py-1 text-xs hover:border-teal hover:text-teal">
                Fines de semana
              </button>
              <button type="button" onClick={() => applyPreset("weekdays")} className="rounded-full border border-gray-200 px-2.5 py-1 text-xs hover:border-teal hover:text-teal">
                Laborables
              </button>
              <button type="button" onClick={() => applyPreset("daily")} className="rounded-full border border-gray-200 px-2.5 py-1 text-xs hover:border-teal hover:text-teal">
                Cada día
              </button>
            </div>

            <select
              value={offFreq}
              onChange={(e) => setOffFreq(e.target.value as RecurrenceFreq)}
              className="mt-2 h-9 w-full rounded-md border border-gray-200 px-2 text-sm"
            >
              {RECURRENCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            {offFreq === "weekly" && (
              <div className="mt-2 flex flex-wrap gap-1">
                {WEEKDAY_SHORT.map((label, day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleWeekday(day)}
                    className={`h-8 w-10 rounded-md border text-xs font-medium ${
                      offWeekdays.includes(day)
                        ? "border-teal bg-teal text-white"
                        : "border-gray-200 text-gray-600 hover:border-teal/50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {offFreq !== "none" && (
              <div className="mt-2">
                <Label className="text-xs">Repetir hasta (opcional)</Label>
                <Input type="date" value={offUntil} onChange={(e) => setOffUntil(e.target.value)} className="mt-1 h-9" />
              </div>
            )}
          </div>

          <Button size="sm" onClick={handleAddTimeOff}>
            <Plus className="mr-1.5 h-4 w-4" /> Añadir bloqueo
          </Button>
        </div>

        <div className="mt-4 space-y-2">
          {timeOff.length === 0 ? (
            <p className="text-sm text-gray-400">Sin bloqueos.</p>
          ) : (
            timeOff.map((t) => {
              const pro = professionals.find((p) => p.id === t.professional_id);
              const recurrence = describeRecurrence(t);
              return (
                <div key={t.id} className="flex items-center justify-between gap-3 rounded-lg bg-red-50 px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <span className="font-medium text-navy">{pro?.name ?? "Todo el centro"}</span>
                    <span className="ml-2 text-gray-500">
                      {formatInTimeZone(new Date(t.start_at), CLINIC_TZ, "d MMM HH:mm", { locale: es })} →{" "}
                      {formatInTimeZone(new Date(t.end_at), CLINIC_TZ, "d MMM HH:mm", { locale: es })}
                    </span>
                    {recurrence && (
                      <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-600">
                        <Repeat className="h-3 w-3" /> {recurrence}
                      </span>
                    )}
                    {t.reason && <span className="block text-xs text-gray-400">{t.reason}</span>}
                  </div>
                  <button onClick={() => handleDeleteTimeOff(t.id)} className="shrink-0 text-gray-400 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
