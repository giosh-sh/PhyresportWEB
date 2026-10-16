"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
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
import { formatInTimeZone } from "date-fns-tz";
import { zonedDateTimeToUtc, CLINIC_TZ } from "@/lib/citas/slots";
import {
  APPOINTMENT_STATUS_OPTIONS,
  CUBICLES,
  type AppointmentFull,
  type AppointmentStatus,
  type BookingService,
  type Professional,
} from "@/lib/citas/types";
import {
  createManualAppointment,
  deleteAppointment,
  rescheduleAppointment,
  updateAppointmentDetails,
  updateAppointmentStatus,
} from "@/lib/citas/actions";

export interface AppointmentDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  professionals: Professional[];
  services: BookingService[];
  appointment: AppointmentFull | null;
  defaultProfessionalId?: string | null;
  defaultStartISO?: string | null;
}

function splitISO(iso: string): { date: string; time: string } {
  return {
    date: formatInTimeZone(new Date(iso), CLINIC_TZ, "yyyy-MM-dd"),
    time: formatInTimeZone(new Date(iso), CLINIC_TZ, "HH:mm"),
  };
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function minutesToTime(m: number): string {
  const h = Math.floor(m / 60) % 24;
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function AppointmentDialog({
  open,
  onClose,
  onSaved,
  professionals,
  services,
  appointment,
  defaultProfessionalId,
  defaultStartISO,
}: AppointmentDialogProps) {
  const [serviceId, setServiceId] = useState("");
  const [professionalId, setProfessionalId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<AppointmentStatus>("confirmada");
  const [cubicle, setCubicle] = useState("");
  const [conflict, setConflict] = useState<{ message: string; suggestions: string[] } | null>(null);
  const [saving, setSaving] = useState(false);

  const professionalCubicle = (proId: string) =>
    professionals.find((p) => p.id === proId)?.cubicle ?? "";

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza el formulario al abrir
    setConflict(null);
    if (appointment) {
      const { date: d, time: t } = splitISO(appointment.start_at);
      const end = formatInTimeZone(new Date(appointment.end_at), CLINIC_TZ, "HH:mm");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza el formulario al abrir
      setServiceId(appointment.service_id ?? services[0]?.id ?? "");
      setProfessionalId(appointment.professional_id ?? professionals[0]?.id ?? "");
      setCubicle(appointment.cubicle || professionalCubicle(appointment.professional_id ?? ""));
      setDate(d);
      setTime(t);
      setEndTime(end);
      setName(appointment.patient_name);
      setEmail(appointment.patient_email ?? "");
      setPhone(appointment.patient_phone ?? "");
      setNotes(appointment.notes ?? "");
      setStatus(appointment.status);
    } else {
      const start = defaultStartISO ? splitISO(defaultStartISO) : { date: "", time: "10:00" };
      const dur = services[0]?.duration_minutes ?? 60;
      const proId = defaultProfessionalId ?? professionals[0]?.id ?? "";
      setServiceId(services[0]?.id ?? "");
      setProfessionalId(proId);
      setCubicle(professionalCubicle(proId));
      setDate(start.date || formatInTimeZone(new Date(), CLINIC_TZ, "yyyy-MM-dd"));
      setTime(start.time);
      setEndTime(minutesToTime(timeToMinutes(start.time) + dur));
      setName("");
      setEmail("");
      setPhone("");
      setNotes("");
      setStatus("confirmada");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, appointment, defaultProfessionalId, defaultStartISO, professionals, services]);

  async function handleSave(allowConflict = false) {
    if (!name.trim()) return toast.error("El nombre es obligatorio");
    if (!date || !time) return toast.error("Indica fecha y hora");
    const duration = timeToMinutes(endTime) - timeToMinutes(time);
    if (duration <= 0) return toast.error("La hora de fin debe ser posterior a la de inicio");
    const startISO = zonedDateTimeToUtc(date, time).toISOString();
    setSaving(true);

    let res: {
      success?: boolean;
      error?: string;
      id?: string;
      conflict?: boolean;
      message?: string;
      suggestions?: string[];
    };
    if (appointment) {
      res = await updateAppointmentDetails(appointment.id, {
        patientName: name,
        patientEmail: email,
        patientPhone: phone,
        notes,
        serviceId,
      });
      const originalDuration = Math.round(
        (new Date(appointment.end_at).getTime() - new Date(appointment.start_at).getTime()) / 60000
      );
      const scheduleChanged =
        appointment.start_at !== startISO ||
        appointment.professional_id !== professionalId ||
        originalDuration !== duration ||
        (appointment.cubicle ?? "") !== cubicle;
      if (!res.error && scheduleChanged) {
        res = await rescheduleAppointment(
          appointment.id,
          professionalId,
          startISO,
          duration,
          cubicle,
          allowConflict
        );
      }
      if (!res.error && !res.conflict && appointment.status !== status) {
        res = await updateAppointmentStatus(appointment.id, status);
      }
    } else {
      res = await createManualAppointment({
        professionalId,
        serviceId,
        startISO,
        patientName: name,
        patientEmail: email,
        patientPhone: phone,
        notes,
        status,
        durationMinutes: duration,
        cubicle,
        allowConflict,
      });
    }

    setSaving(false);
    if (res.conflict) {
      setConflict({ message: res.message ?? "Conflicto de cubículo", suggestions: res.suggestions ?? [] });
      return;
    }
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(appointment ? "Cita actualizada" : "Cita creada");
    onSaved();
    onClose();
  }

  async function handleDelete() {
    if (!appointment) return;
    if (!confirm("¿Eliminar esta cita?")) return;
    const res = await deleteAppointment(appointment.id);
    if (res.error) return toast.error(res.error);
    toast.success("Cita eliminada");
    onSaved();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{appointment ? "Editar cita" : "Nueva cita"}</DialogTitle>
          <DialogDescription>
            {appointment ? "Modifica los datos o reprograma la cita." : "Crea una cita manualmente."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Servicio</Label>
              <select
                value={serviceId}
                onChange={(e) => {
                  setServiceId(e.target.value);
                  const svc = services.find((s) => s.id === e.target.value);
                  if (svc) setEndTime(minutesToTime(timeToMinutes(time) + svc.duration_minutes));
                }}
                className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.duration_minutes}′)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Profesional</Label>
              <select
                value={professionalId}
                onChange={(e) => {
                  setProfessionalId(e.target.value);
                  setCubicle(professionalCubicle(e.target.value));
                }}
                className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label>Cubículo</Label>
            <select
              value={cubicle}
              onChange={(e) => setCubicle(e.target.value)}
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Sin cubículo</option>
              {CUBICLES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              {cubicle && !CUBICLES.includes(cubicle as (typeof CUBICLES)[number]) && (
                <option value={cubicle}>{cubicle}</option>
              )}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Fecha</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Hora inicio</Label>
              <Input
                type="time"
                step={900}
                value={time}
                onChange={(e) => {
                  const newStart = e.target.value;
                  const prevDuration = timeToMinutes(endTime) - timeToMinutes(time);
                  setTime(newStart);
                  setEndTime(minutesToTime(timeToMinutes(newStart) + Math.max(15, prevDuration)));
                }}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Hora fin</Label>
              <Input
                type="time"
                step={900}
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label>Paciente *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre y apellidos" className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" />
            </div>
          </div>
          <div>
            <Label>Notas</Label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <Label>Estado</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as AppointmentStatus)}
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {APPOINTMENT_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {conflict && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm">
            <p className="font-semibold text-amber-700">⚠ {conflict.message}</p>
            {conflict.suggestions.length > 0 ? (
              <>
                <p className="mt-1 text-amber-700">
                  Horas recomendadas (agenda y cubículo libres):
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {conflict.suggestions.map((s) => {
                    const dur = timeToMinutes(endTime) - timeToMinutes(time);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setTime(formatInTimeZone(new Date(s), CLINIC_TZ, "HH:mm"));
                          setEndTime(
                            formatInTimeZone(
                              new Date(new Date(s).getTime() + Math.max(15, dur) * 60000),
                              CLINIC_TZ,
                              "HH:mm"
                            )
                          );
                          setConflict(null);
                        }}
                        className="rounded-full border border-amber-400 bg-white px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100"
                      >
                        {formatInTimeZone(new Date(s), CLINIC_TZ, "HH:mm")}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <p className="mt-1 text-amber-700">No hay horas libres ese día para ese cubículo.</p>
            )}
            <button
              type="button"
              onClick={() => {
                void handleSave(true);
              }}
              className="mt-3 text-xs font-semibold text-amber-700 underline"
            >
              Guardar de todas formas
            </button>
          </div>
        )}

        <DialogFooter className="flex-row justify-between gap-2 sm:justify-between">
          {appointment ? (
            <Button type="button" variant="ghost" className="text-destructive" onClick={handleDelete}>
              <Trash2 className="mr-1.5 h-4 w-4" /> Eliminar
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => { void handleSave(); }} disabled={saving}>
              {saving ? "Guardando…" : appointment ? "Guardar" : "Crear cita"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
