"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";
import { CLINIC_TZ, zonedDateTimeToUtc } from "@/lib/citas/slots";
import { parseQuickSession } from "@/lib/citas/nl-parse";
import { createManualAppointment } from "@/lib/citas/actions";
import type { BookingService, Professional } from "@/lib/citas/types";

export function QuickAddBar({
  professionals,
  services,
  onCreated,
}: {
  professionals: Professional[];
  services: BookingService[];
  onCreated: () => void;
}) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    try {
      const todayKey = formatInTimeZone(new Date(), CLINIC_TZ, "yyyy-MM-dd");
      const parsed = parseQuickSession(text, professionals, services, todayKey);
      if (parsed.error) {
        toast.error(parsed.error);
        return;
      }

      const startISO = zonedDateTimeToUtc(parsed.date!, parsed.startTime!).toISOString();
      const res = await createManualAppointment({
        professionalId: parsed.professionalId!,
        serviceId: parsed.serviceId ?? services[0]?.id ?? "",
        startISO,
        patientName: "Cita rápida",
        durationMinutes: parsed.durationMinutes,
        status: "confirmada",
      });

      if (res.conflict) {
        const times = (res.suggestions ?? [])
          .map((s) => formatInTimeZone(new Date(s), CLINIC_TZ, "HH:mm"))
          .join(", ");
        toast.warning(`${res.message}${times ? ` — prueba a las: ${times}` : ""}`);
        return;
      }
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(
        `Sesión añadida el ${formatInTimeZone(
          zonedDateTimeToUtc(parsed.date!, parsed.startTime!),
          CLINIC_TZ,
          "d MMM 'a las' HH:mm",
          { locale: es }
        )}`
      );
      setText("");
      onCreated();
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo añadir la sesión.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-3 flex flex-col gap-2 rounded-xl border border-teal/30 bg-teal/5 p-2 sm:flex-row sm:items-center"
    >
      <span className="flex items-center gap-1.5 pl-1 text-xs font-semibold text-teal">
        <Sparkles className="h-4 w-4" /> Asistente
      </span>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder='Escribe: "sesión de 10:00 a 11:00 con Marichal el 12 de noviembre"'
        className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
      />
      <button
        type="submit"
        disabled={loading || !text.trim()}
        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
        Añadir
      </button>
    </form>
  );
}
