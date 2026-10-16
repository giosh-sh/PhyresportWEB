"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Lock, Repeat, Trash2 } from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { zonedDateTimeToUtc, CLINIC_TZ } from "@/lib/citas/slots";
import {
  RECURRENCE_OPTIONS,
  WEEKDAY_SHORT,
  type Professional,
  type RecurrenceFreq,
  type TimeOff,
} from "@/lib/citas/types";
import { deleteTimeOff, updateTimeOff } from "@/lib/citas/actions";

function splitISO(iso: string): { date: string; time: string } {
  return {
    date: formatInTimeZone(new Date(iso), CLINIC_TZ, "yyyy-MM-dd"),
    time: formatInTimeZone(new Date(iso), CLINIC_TZ, "HH:mm"),
  };
}

export function TimeOffDialog({
  open,
  onClose,
  onSaved,
  timeOff,
  professionals,
  canEdit,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  timeOff: TimeOff | null;
  professionals: Professional[];
  canEdit: boolean;
}) {
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("21:00");
  const [allDay, setAllDay] = useState(false);
  const [reason, setReason] = useState("");
  const [freq, setFreq] = useState<RecurrenceFreq>("none");
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [until, setUntil] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !timeOff) return;
    const baseStart = splitISO(timeOff.base_start_at ?? timeOff.start_at);
    const baseEnd = splitISO(timeOff.base_end_at ?? timeOff.end_at);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza el formulario al abrir
    setStartDate(baseStart.date);
    setStartTime(baseStart.time);
    setEndDate(baseEnd.date);
    setEndTime(baseEnd.time);
    setAllDay(timeOff.all_day);
    setReason(timeOff.reason ?? "");
    setFreq(timeOff.recurrence ?? "none");
    setWeekdays(timeOff.recurrence_weekdays ?? []);
    setUntil(timeOff.recurrence_until ? String(timeOff.recurrence_until).slice(0, 10) : "");
  }, [open, timeOff]);

  const proName = timeOff?.professional_id
    ? professionals.find((p) => p.id === timeOff.professional_id)?.name ?? "Profesional"
    : "Todo el centro";

  function toggleWeekday(day: number) {
    setWeekdays((w) => (w.includes(day) ? w.filter((d) => d !== day) : [...w, day]));
  }

  async function handleSave() {
    if (!timeOff) return;
    if (!startDate || !startTime || !endDate || !endTime) return toast.error("Indica fecha y hora");
    if (freq === "weekly" && weekdays.length === 0) return toast.error("Selecciona al menos un día");
    if (freq !== "none" && !until) return toast.error("Indica hasta cuándo se repite");

    const startISO = zonedDateTimeToUtc(startDate, startTime).toISOString();
    const endISO = zonedDateTimeToUtc(endDate, endTime).toISOString();
    if (new Date(endISO) <= new Date(startISO)) return toast.error("El fin debe ser posterior al inicio");

    setSaving(true);
    const res = await updateTimeOff(timeOff.id, {
      startISO,
      endISO,
      allDay,
      reason,
      recurrence: freq,
      recurrenceInterval: 1,
      recurrenceWeekdays: freq === "weekly" ? weekdays : [],
      recurrenceUntil: freq !== "none" ? until : null,
    });
    setSaving(false);
    if (res.error) return toast.error(res.error);
    toast.success("Bloqueo actualizado");
    onSaved();
    onClose();
  }

  async function handleDelete() {
    if (!timeOff) return;
    if (!confirm("¿Eliminar este bloqueo (toda la serie)?")) return;
    const res = await deleteTimeOff(timeOff.id);
    if (res.error) return toast.error(res.error);
    toast.success("Bloqueo eliminado");
    onSaved();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-red-500" /> Bloqueo de agenda
          </DialogTitle>
          <DialogDescription>
            {canEdit
              ? "Edita o elimina este bloqueo. Afecta a toda la serie si es recurrente."
              : "Este bloqueo pertenece a otro profesional: solo puedes consultarlo."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Profesional</Label>
            <p className="mt-1 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-navy">{proName}</p>
          </div>

          <fieldset disabled={!canEdit} className="space-y-4 disabled:opacity-70">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Desde (fecha)</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Hora</Label>
                <Input
                  type="time"
                  step={900}
                  value={startTime}
                  disabled={allDay}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Hasta (fecha)</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Hora</Label>
                <Input
                  type="time"
                  step={900}
                  value={endTime}
                  disabled={allDay}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
              Todo el día
            </label>

            <div>
              <Label>Motivo</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1" />
            </div>

            <div className="rounded-lg bg-ice/50 p-3">
              <Label className="flex items-center gap-1.5 text-xs font-semibold text-navy">
                <Repeat className="h-3.5 w-3.5" /> Repetición
              </Label>
              <select
                value={freq}
                onChange={(e) => setFreq(e.target.value as RecurrenceFreq)}
                className="mt-2 h-9 w-full rounded-md border border-gray-200 px-2 text-sm"
              >
                {RECURRENCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>

              {freq === "weekly" && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {WEEKDAY_SHORT.map((label, day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleWeekday(day)}
                      className={`h-8 w-10 rounded-md border text-xs font-medium ${
                        weekdays.includes(day)
                          ? "border-teal bg-teal text-white"
                          : "border-gray-200 text-gray-600 hover:border-teal/50"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}

              {freq !== "none" && (
                <div className="mt-2">
                  <Label className="text-xs">Repetir hasta</Label>
                  <Input type="date" value={until} onChange={(e) => setUntil(e.target.value)} className="mt-1 h-9" />
                </div>
              )}
            </div>
          </fieldset>
        </div>

        <DialogFooter className="flex-row justify-between gap-2 sm:justify-between">
          {canEdit ? (
            <Button type="button" variant="ghost" className="text-destructive" onClick={handleDelete}>
              <Trash2 className="mr-1.5 h-4 w-4" /> Eliminar
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {canEdit ? "Cancelar" : "Cerrar"}
            </Button>
            {canEdit && (
              <Button type="button" onClick={handleSave} disabled={saving}>
                {saving ? "Guardando…" : "Guardar"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
