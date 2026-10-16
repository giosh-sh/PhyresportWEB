"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  Sparkles,
  UserRound,
} from "lucide-react";
import { ANY_PROFESSIONAL, type BookingService, type Professional, type Slot } from "@/lib/citas/types";
import { CLINIC_TZ } from "@/lib/citas/slots";
import { createPublicBooking } from "@/lib/citas/actions";

const STEPS = ["Servicio", "Profesional", "Fecha", "Datos"] as const;

function todayKey(): string {
  return formatInTimeZone(new Date(), CLINIC_TZ, "yyyy-MM-dd");
}

function addDaysKey(key: string, days: number): string {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function dayLabel(key: string): { weekday: string; day: string } {
  const date = new Date(`${key}T12:00:00Z`);
  return {
    weekday: formatInTimeZone(date, "UTC", "EEE", { locale: es }).replace(".", ""),
    day: formatInTimeZone(date, "UTC", "d MMM", { locale: es }),
  };
}

export function BookingWizard({
  services,
  professionals,
}: {
  services: BookingService[];
  professionals: Professional[];
}) {
  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState<string>(services[0]?.id ?? "");
  const [professionalId, setProfessionalId] = useState<string>(ANY_PROFESSIONAL);
  const [date, setDate] = useState<string>(todayKey());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slot, setSlot] = useState<Slot | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ professionalName: string } | null>(null);

  const days = useMemo(() => {
    const base = todayKey();
    return Array.from({ length: 21 }, (_, i) => addDaysKey(base, i));
  }, []);

  const service = services.find((s) => s.id === serviceId) ?? null;

  const loadSlots = useCallback(async () => {
    if (!serviceId) return;
    setLoadingSlots(true);
    setSlot(null);
    try {
      const res = await fetch(
        `/api/citas/slots?date=${date}&serviceId=${serviceId}&professionalId=${professionalId}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      setSlots(data.slots ?? []);
    } catch {
      setSlots([]);
    }
    setLoadingSlots(false);
  }, [date, serviceId, professionalId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga de franjas al entrar en el paso 3
    if (step === 2) loadSlots();
  }, [step, loadSlots]);

  const canNext =
    (step === 0 && !!serviceId) ||
    (step === 1 && !!professionalId) ||
    (step === 2 && !!slot) ||
    step === 3;

  async function submit() {
    if (!slot) return;
    setSubmitting(true);
    setError("");
    const res = await createPublicBooking({
      serviceId,
      professionalId,
      startISO: slot.start,
      patientName: name,
      patientEmail: email,
      patientPhone: phone,
      notes,
    });
    setSubmitting(false);
    if (res.error) {
      setError(res.error);
      if (res.error.includes("hueco")) {
        setStep(2);
        loadSlots();
      }
      return;
    }
    setDone({ professionalName: res.professionalName ?? "" });
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg text-center py-10">
        <CheckCircle2 className="mx-auto h-14 w-14 text-teal" />
        <h2 className="mt-5 font-display text-3xl font-bold text-navy">¡Cita solicitada!</h2>
        <p className="mt-3 text-gray-500">
          Hemos recibido tu reserva{service ? ` de ${service.name}` : ""}
          {done.professionalName ? ` con ${done.professionalName}` : ""} para el{" "}
          <strong>
            {formatInTimeZone(new Date(slot!.start), CLINIC_TZ, "EEEE d 'de' MMMM 'a las' HH:mm", {
              locale: es,
            })}
          </strong>
          .
        </p>
        <p className="mt-2 text-sm text-gray-400">
          Te hemos enviado un correo con los detalles. Te confirmaremos lo antes posible.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Stepper */}
      <ol className="mb-8 flex items-center justify-center gap-2 sm:gap-4">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                i < step
                  ? "bg-teal text-white"
                  : i === step
                    ? "bg-navy text-white"
                    : "bg-gray-100 text-gray-400"
              }`}
            >
              {i < step ? "✓" : i + 1}
            </span>
            <span className={`hidden text-sm sm:inline ${i === step ? "text-navy font-medium" : "text-gray-400"}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && <span className="hidden h-px w-6 bg-gray-200 sm:block" />}
          </li>
        ))}
      </ol>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {step === 0 && (
              <div className="space-y-3">
                <StepTitle icon={Sparkles} title="¿Qué necesitas?" subtitle="Elige el tratamiento o servicio." />
                <div className="grid gap-3 sm:grid-cols-2">
                  {services.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setServiceId(s.id)}
                      className={`rounded-xl border p-4 text-left transition-all ${
                        serviceId === s.id
                          ? "border-teal ring-2 ring-teal/20 bg-teal/5"
                          : "border-gray-200 hover:border-teal/50"
                      }`}
                    >
                      <span className="flex items-center gap-2 font-display font-bold text-navy">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color ?? "#00B8D4" }} />
                        {s.name}
                      </span>
                      <span className="mt-1 flex items-center gap-1.5 text-sm text-gray-400">
                        <Clock className="h-3.5 w-3.5" /> {s.duration_minutes} min
                      </span>
                      {s.description && <span className="mt-1 block text-sm text-gray-500">{s.description}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-3">
                <StepTitle icon={UserRound} title="Elige profesional" subtitle="O deja que te asignemos el primero disponible." />
                <button
                  type="button"
                  onClick={() => setProfessionalId(ANY_PROFESSIONAL)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all ${
                    professionalId === ANY_PROFESSIONAL
                      ? "border-teal ring-2 ring-teal/20 bg-teal/5"
                      : "border-gray-200 hover:border-teal/50"
                  }`}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy text-white">
                    <Sparkles className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block font-display font-bold text-navy">Cualquier profesional disponible</span>
                    <span className="block text-sm text-gray-400">Te asignamos al más libre para que reserves antes.</span>
                  </span>
                </button>

                <div className="grid gap-3 sm:grid-cols-2">
                  {professionals.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setProfessionalId(p.id)}
                      className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                        professionalId === p.id
                          ? "border-teal ring-2 ring-teal/20 bg-teal/5"
                          : "border-gray-200 hover:border-teal/50"
                      }`}
                    >
                      <span
                        className="flex h-10 w-10 items-center justify-center rounded-full font-display font-bold text-white"
                        style={{ backgroundColor: p.color }}
                      >
                        {p.name.charAt(0)}
                      </span>
                      <span>
                        <span className="block font-medium text-navy">{p.name}</span>
                        {p.specialty && <span className="block text-xs text-gray-400">{p.specialty}</span>}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <StepTitle icon={CalendarDays} title="Fecha y hora" subtitle="Solo mostramos huecos realmente libres." />
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {days.map((d) => {
                    const { weekday, day } = dayLabel(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDate(d)}
                        className={`min-w-[68px] rounded-xl border px-3 py-2 text-center transition-all ${
                          date === d ? "border-teal bg-teal text-white" : "border-gray-200 text-navy hover:border-teal/50"
                        }`}
                      >
                        <span className="block text-[11px] uppercase">{weekday}</span>
                        <span className="block text-sm font-semibold">{day}</span>
                      </button>
                    );
                  })}
                </div>

                {loadingSlots ? (
                  <div className="flex items-center justify-center gap-2 py-10 text-gray-400">
                    <Loader2 className="h-5 w-5 animate-spin" /> Buscando huecos…
                  </div>
                ) : slots.length === 0 ? (
                  <p className="py-10 text-center text-gray-400">
                    No hay huecos disponibles este día. Prueba con otra fecha.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {slots.map((s) => {
                      const label = formatInTimeZone(new Date(s.start), CLINIC_TZ, "HH:mm");
                      return (
                        <button
                          key={s.start}
                          type="button"
                          onClick={() => setSlot(s)}
                          className={`rounded-lg border px-2 py-2.5 text-sm font-medium transition-all ${
                            slot?.start === s.start
                              ? "border-teal bg-teal text-white"
                              : "border-gray-200 text-navy hover:border-teal/60 hover:bg-teal/5"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <StepTitle icon={UserRound} title="Tus datos" subtitle="Revisa y confirma tu cita." />
                <div className="rounded-xl bg-ice/60 p-4 text-sm">
                  <p className="text-navy">
                    <strong>{service?.name}</strong>
                    {" · "}
                    {professionalId === ANY_PROFESSIONAL
                      ? "Cualquier profesional disponible"
                      : professionals.find((p) => p.id === professionalId)?.name}
                  </p>
                  {slot && (
                    <p className="mt-1 text-gray-500">
                      {formatInTimeZone(new Date(slot.start), CLINIC_TZ, "EEEE d 'de' MMMM 'a las' HH:mm", {
                        locale: es,
                      })}
                    </p>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Nombre y apellidos *" value={name} onChange={setName} placeholder="Tu nombre" />
                  <Field label="Email *" value={email} onChange={setEmail} placeholder="tucorreo@email.com" type="email" />
                </div>
                <Field label="Teléfono" value={phone} onChange={setPhone} placeholder="Opcional" type="tel" />
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-navy">Comentarios</label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
                    placeholder="¿Algo que debamos saber? (opcional)"
                  />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Nav */}
        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-gray-500 hover:text-navy disabled:opacity-0"
          >
            <ArrowLeft className="h-4 w-4" /> Atrás
          </button>

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(3, s + 1))}
              disabled={!canNext}
              className="inline-flex items-center gap-2 rounded-full bg-teal px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-cyan disabled:opacity-50"
            >
              Continuar <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={submitting || !name || !email}
              className="inline-flex items-center gap-2 rounded-full bg-teal px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-cyan disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Confirmar cita
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepTitle({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-ice text-teal">
        <Icon className="h-5 w-5" />
      </span>
      <span>
        <span className="block font-display text-lg font-bold text-navy">{title}</span>
        <span className="block text-sm text-gray-400">{subtitle}</span>
      </span>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-navy">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
      />
    </div>
  );
}
