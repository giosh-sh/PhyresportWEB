"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Columns3,
  Loader2,
  Plus,
} from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CLINIC_TZ, zonedDateTimeToUtc } from "@/lib/citas/slots";
import {
  APPOINTMENT_STATUS_COLORS,
  APPOINTMENT_STATUS_LABELS,
  type AppointmentFull,
  type BookingService,
  type Professional,
} from "@/lib/citas/types";
import { getAppointmentsBetween, rescheduleAppointment } from "@/lib/citas/actions";
import { AppointmentDialog } from "./AppointmentDialog";
import { AvailabilityManager } from "./AvailabilityManager";

type ViewMode = "day" | "week" | "month" | "agenda";

const GRID_START_HOUR = 8;
const GRID_END_HOUR = 22;
const ROW_MINUTES = 30;
const ROW_HEIGHT = 44;
const ROWS = ((GRID_END_HOUR - GRID_START_HOUR) * 60) / ROW_MINUTES;

function dateKey(d: Date): string {
  return formatInTimeZone(d, CLINIC_TZ, "yyyy-MM-dd");
}
function addDaysKey(key: string, days: number): string {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
function startOfWeekKey(key: string): string {
  const d = new Date(`${key}T00:00:00Z`);
  const day = d.getUTCDay(); // 0 dom
  const diff = day === 0 ? -6 : 1 - day; // lunes
  return addDaysKey(key, diff);
}
function rangeStartISO(key: string): string {
  return zonedDateTimeToUtc(key, "00:00").toISOString();
}

function timeLabel(iso: string, fmt = "HH:mm"): string {
  return formatInTimeZone(new Date(iso), CLINIC_TZ, fmt, { locale: es });
}

export function CitasDashboard({
  professionals,
  services,
  currentProfessionalId,
}: {
  professionals: Professional[];
  services: BookingService[];
  currentProfessionalId: string | null;
}) {
  const [tab, setTab] = useState("agenda");
  const [view, setView] = useState<ViewMode>("week");
  const [cursorKey, setCursorKey] = useState(dateKey(new Date()));
  const [proFilter, setProFilter] = useState<string>(currentProfessionalId || "all");
  const [resourceView, setResourceView] = useState(true);
  const [appointments, setAppointments] = useState<AppointmentFull[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AppointmentFull | null>(null);
  const [defaultPro, setDefaultPro] = useState<string | null>(null);
  const [defaultStart, setDefaultStart] = useState<string | null>(null);

  const professionalsById = useMemo(() => {
    const map = new Map<string, Professional>();
    professionals.forEach((p) => map.set(p.id, p));
    return map;
  }, [professionals]);

  const range = useMemo(() => {
    if (view === "day") {
      return { start: rangeStartISO(cursorKey), end: rangeStartISO(addDaysKey(cursorKey, 1)) };
    }
    if (view === "week") {
      const s = startOfWeekKey(cursorKey);
      return { start: rangeStartISO(s), end: rangeStartISO(addDaysKey(s, 7)) };
    }
    if (view === "month") {
      const first = `${cursorKey.slice(0, 7)}-01`;
      const s = startOfWeekKey(first);
      return { start: rangeStartISO(s), end: rangeStartISO(addDaysKey(s, 42)) };
    }
    return { start: rangeStartISO(cursorKey), end: rangeStartISO(addDaysKey(cursorKey, 30)) };
  }, [view, cursorKey]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setAppointments(await getAppointmentsBetween(range.start, range.end));
    } catch {
      setAppointments([]);
    }
    setLoading(false);
  }, [range.start, range.end]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount / cambio de rango
    load();
  }, [load]);

  const visibleProfessionals = useMemo(() => {
    if (proFilter === "all") return professionals;
    return professionals.filter((p) => p.id === proFilter);
  }, [professionals, proFilter]);

  const visibleAppointments = useMemo(() => {
    if (proFilter === "all") return appointments;
    return appointments.filter((a) => a.professional_id === proFilter);
  }, [appointments, proFilter]);

  function openCreate(professionalId?: string | null, startISO?: string | null) {
    setEditing(null);
    setDefaultPro(professionalId ?? (proFilter !== "all" ? proFilter : professionals[0]?.id ?? null));
    setDefaultStart(startISO ?? null);
    setDialogOpen(true);
  }
  function openEdit(appt: AppointmentFull) {
    setEditing(appt);
    setDialogOpen(true);
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const data = over.data.current as { professionalId?: string; startISO?: string } | undefined;
    if (!data?.professionalId || !data.startISO) return;
    const appt = appointments.find((a) => a.id === active.id);
    if (!appt) return;
    if (appt.professional_id === data.professionalId && appt.start_at === data.startISO) return;

    const res = await rescheduleAppointment(String(active.id), data.professionalId, data.startISO);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Cita reprogramada");
    load();
  }

  function shift(delta: number) {
    if (view === "month") {
      const [y, m] = cursorKey.split("-").map(Number);
      const nd = new Date(Date.UTC(y, m - 1 + delta, 1));
      setCursorKey(nd.toISOString().slice(0, 10));
    } else if (view === "week") {
      setCursorKey(addDaysKey(cursorKey, delta * 7));
    } else {
      setCursorKey(addDaysKey(cursorKey, delta));
    }
  }

  const label = useMemo(() => {
    if (view === "day") return timeLabel(range.start, "EEEE d 'de' MMMM");
    if (view === "week") {
      const s = startOfWeekKey(cursorKey);
      return `${timeLabel(rangeStartISO(s), "d MMM")} – ${timeLabel(rangeStartISO(addDaysKey(s, 6)), "d MMM yyyy")}`;
    }
    if (view === "month") return timeLabel(rangeStartISO(`${cursorKey.slice(0, 7)}-01`), "MMMM yyyy");
    return "Próximos 30 días";
  }, [view, cursorKey, range.start]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-navy">Gestión de citas</h1>
          <p className="text-sm text-gray-500">Agenda del equipo, disponibilidad y bloqueos.</p>
        </div>
        <Button onClick={() => openCreate()}>
          <Plus className="mr-1.5 h-4 w-4" /> Nueva cita
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
          <TabsTrigger value="disponibilidad">Disponibilidad</TabsTrigger>
        </TabsList>

        <TabsContent value="agenda" className="mt-4">
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 p-3">
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="h-9 w-9 p-0" onClick={() => shift(-1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCursorKey(dateKey(new Date()))}>
                  Hoy
                </Button>
                <Button variant="outline" size="sm" className="h-9 w-9 p-0" onClick={() => shift(1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <span className="mx-1 font-display font-semibold capitalize text-navy">{label}</span>

              <div className="ml-auto flex flex-wrap items-center gap-2">
                {/* Vista */}
                <div className="flex overflow-hidden rounded-lg border border-gray-200">
                  {(
                    [
                      ["day", "Día"],
                      ["week", "Semana"],
                      ["month", "Mes"],
                      ["agenda", "Agenda"],
                    ] as [ViewMode, string][]
                  ).map(([v, l]) => (
                    <button
                      key={v}
                      onClick={() => setView(v)}
                      className={`px-3 py-1.5 text-sm ${view === v ? "bg-navy text-white" : "text-gray-600 hover:bg-gray-50"}`}
                    >
                      {l}
                    </button>
                  ))}
                </div>

                <select
                  value={proFilter}
                  onChange={(e) => setProFilter(e.target.value)}
                  className="h-9 rounded-md border border-gray-200 px-2 text-sm"
                >
                  <option value="all">Todos los profesionales</option>
                  {currentProfessionalId && <option value={currentProfessionalId}>Solo mi agenda</option>}
                  {professionals.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>

                {view === "day" && (
                  <button
                    onClick={() => setResourceView((v) => !v)}
                    className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm ${
                      resourceView ? "border-teal bg-teal/10 text-teal" : "border-gray-200 text-gray-600"
                    }`}
                    title="Vista de recursos (columnas por profesional)"
                  >
                    <Columns3 className="h-4 w-4" /> Recursos
                  </button>
                )}
              </div>
            </div>

            <div className="p-3">
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-20 text-gray-400">
                  <Loader2 className="h-5 w-5 animate-spin" /> Cargando agenda…
                </div>
              ) : tab === "agenda" && view === "day" ? (
                <DndContext sensors={sensors} onDragEnd={onDragEnd}>
                  <DayView
                    cursorKey={cursorKey}
                    professionals={visibleProfessionals}
                    appointments={visibleAppointments}
                    onEdit={openEdit}
                    onCreate={openCreate}
                  />
                </DndContext>
              ) : view === "week" ? (
                <WeekView
                  cursorKey={cursorKey}
                  professionalsById={professionalsById}
                  appointments={visibleAppointments}
                  onEdit={openEdit}
                  onPickDay={(k) => {
                    setCursorKey(k);
                    setView("day");
                  }}
                />
              ) : view === "month" ? (
                <MonthView
                  cursorKey={cursorKey}
                  appointments={visibleAppointments}
                  onEdit={openEdit}
                  onPickDay={(k) => {
                    setCursorKey(k);
                    setView("day");
                  }}
                />
              ) : (
                <AgendaView
                  professionalsById={professionalsById}
                  appointments={visibleAppointments}
                  onEdit={openEdit}
                />
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="disponibilidad" className="mt-4">
          <AvailabilityManager professionals={professionals} lockedProfessionalId={null} />
        </TabsContent>
      </Tabs>

      <AppointmentDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={load}
        professionals={professionals}
        services={services}
        appointment={editing}
        defaultProfessionalId={defaultPro}
        defaultStartISO={defaultStart}
      />
    </div>
  );
}

/* ---------------- Day (time grid + recursos + DnD) ---------------- */

function DraggableAppointment({
  appt,
  color,
  onEdit,
  compact,
}: {
  appt: AppointmentFull;
  color: string;
  onEdit: (a: AppointmentFull) => void;
  compact?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: appt.id,
    data: { appt },
  });
  const style: React.CSSProperties = {
    borderLeftColor: color,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 40 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`absolute inset-x-1 overflow-hidden rounded-md border border-gray-100 border-l-4 bg-white px-2 py-1 text-left shadow-sm ${
        compact ? "" : "cursor-grab active:cursor-grabbing"
      } ${appt.status === "cancelada" ? "opacity-50 line-through" : ""}`}
      {...attributes}
      {...listeners}
      onClick={() => onEdit(appt)}
    >
      <span className="block truncate text-[11px] font-semibold text-navy">
        {timeLabel(appt.start_at)} {appt.patient_name}
      </span>
      <span className="block truncate text-[10px] text-gray-500">{appt.service_name}</span>
    </div>
  );
}

function DroppableSlot({
  professionalId,
  startISO,
  onClick,
}: {
  professionalId: string;
  startISO: string;
  onClick: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot|${professionalId}|${startISO}`,
    data: { professionalId, startISO },
  });
  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className={`border-b border-gray-100 transition-colors ${isOver ? "bg-teal/10" : "hover:bg-ice/50"}`}
      style={{ height: ROW_HEIGHT }}
    />
  );
}

function DayView({
  cursorKey,
  professionals: pros,
  appointments,
  onEdit,
  onCreate,
}: {
  cursorKey: string;
  professionals: Professional[];
  appointments: AppointmentFull[];
  onEdit: (a: AppointmentFull) => void;
  onCreate: (professionalId?: string | null, startISO?: string | null) => void;
}) {
  const columns = pros.length === 0 ? [null] : pros;

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Headers */}
        <div className="flex">
          <div className="w-14 shrink-0" />
          {columns.map((p) => (
            <div key={p?.id ?? "none"} className="flex-1 border-l border-gray-100 px-2 py-2 text-center">
              {p ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-navy">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                  {p.name}
                </span>
              ) : (
                <span className="text-sm text-gray-400">Sin profesionales</span>
              )}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex">
          {/* Hours */}
          <div className="w-14 shrink-0">
            {Array.from({ length: ROWS }).map((_, i) =>
              i % 2 === 0 ? (
                <div key={i} className="pr-1 text-right text-[11px] text-gray-400" style={{ height: ROW_HEIGHT }}>
                  {`${GRID_START_HOUR + i / 2}`.padStart(2, "0")}:00
                </div>
              ) : (
                <div key={i} style={{ height: ROW_HEIGHT }} />
              )
            )}
          </div>

          {columns.map((pro) => {
            const colAppts = appointments.filter((a) => a.professional_id === pro?.id);
            return (
              <div key={pro?.id ?? "none"} className="relative flex-1 border-l border-gray-100">
                {/* slots */}
                <div>
                  {Array.from({ length: ROWS }).map((_, i) => {
                    const minutes = GRID_START_HOUR * 60 + i * ROW_MINUTES;
                    const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
                    const mm = String(minutes % 60).padStart(2, "0");
                    const startISO = zonedDateTimeToUtc(cursorKey, `${hh}:${mm}`).toISOString();
                    return (
                      <DroppableSlot
                        key={i}
                        professionalId={pro?.id ?? ""}
                        startISO={startISO}
                        onClick={() => pro && onCreate(pro.id, startISO)}
                      />
                    );
                  })}
                </div>
                {/* appointments */}
                {colAppts.map((a) => {
                  const mins = Number(timeLabel(a.start_at, "H")) * 60 + Number(timeLabel(a.start_at, "m"));
                  const top = ((mins - GRID_START_HOUR * 60) / ROW_MINUTES) * ROW_HEIGHT;
                  const height = Math.max(28, (a.service_duration / ROW_MINUTES) * ROW_HEIGHT - 2);
                  return (
                    <div key={a.id} className="absolute inset-x-0" style={{ top, height }}>
                      <DraggableAppointment appt={a} color={a.professional_color} onEdit={onEdit} />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Week ---------------- */

function WeekView({
  cursorKey,
  professionalsById,
  appointments,
  onEdit,
  onPickDay,
}: {
  cursorKey: string;
  professionalsById: Map<string, Professional>;
  appointments: AppointmentFull[];
  onEdit: (a: AppointmentFull) => void;
  onPickDay: (key: string) => void;
}) {
  const start = startOfWeekKey(cursorKey);
  const days = Array.from({ length: 7 }, (_, i) => addDaysKey(start, i));
  const today = dateKey(new Date());

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-7">
      {days.map((k) => {
        const dayAppts = appointments
          .filter((a) => formatInTimeZone(new Date(a.start_at), CLINIC_TZ, "yyyy-MM-dd") === k)
          .sort((a, b) => a.start_at.localeCompare(b.start_at));
        return (
          <div key={k} className={`rounded-lg border ${k === today ? "border-teal/50 bg-teal/5" : "border-gray-100"}`}>
            <button
              onClick={() => onPickDay(k)}
              className="w-full border-b border-gray-100 px-2 py-1.5 text-left text-xs font-medium capitalize text-navy hover:text-teal"
            >
              {timeLabel(rangeStartISO(k), "EEE d")}
            </button>
            <div className="space-y-1 p-1.5">
              {dayAppts.length === 0 ? (
                <p className="py-2 text-center text-[11px] text-gray-300">—</p>
              ) : (
                dayAppts.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => onEdit(a)}
                    className="block w-full rounded border-l-4 bg-white px-1.5 py-1 text-left text-[11px] shadow-sm hover:bg-ice"
                    style={{ borderLeftColor: a.professional_color }}
                  >
                    <span className="block font-semibold text-navy">{timeLabel(a.start_at)}</span>
                    <span className="block truncate text-gray-600">{a.patient_name}</span>
                    <span className="block truncate text-gray-400">
                      {professionalsById.get(a.professional_id ?? "")?.name ?? a.professional_name}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Month ---------------- */

function MonthView({
  cursorKey,
  appointments,
  onEdit,
  onPickDay,
}: {
  cursorKey: string;
  appointments: AppointmentFull[];
  onEdit: (a: AppointmentFull) => void;
  onPickDay: (key: string) => void;
}) {
  const first = `${cursorKey.slice(0, 7)}-01`;
  const start = startOfWeekKey(first);
  const cells = Array.from({ length: 42 }, (_, i) => addDaysKey(start, i));
  const month = cursorKey.slice(0, 7);
  const today = dateKey(new Date());

  return (
    <div>
      <div className="grid grid-cols-7 border-b border-gray-100 pb-1 text-center text-[11px] font-medium uppercase text-gray-400">
        {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((k) => {
          const inMonth = k.slice(0, 7) === month;
          const dayAppts = appointments
            .filter((a) => formatInTimeZone(new Date(a.start_at), CLINIC_TZ, "yyyy-MM-dd") === k)
            .sort((a, b) => a.start_at.localeCompare(b.start_at));
          return (
            <div
              key={k}
              className={`min-h-[92px] border-b border-r border-gray-100 p-1 ${inMonth ? "" : "bg-gray-50/60"}`}
            >
              <button
                onClick={() => onPickDay(k)}
                className={`mb-0.5 text-[11px] font-semibold ${
                  k === today ? "flex h-5 w-5 items-center justify-center rounded-full bg-teal text-white" : "text-gray-500"
                }`}
              >
                {Number(k.slice(8, 10))}
              </button>
              <div className="space-y-0.5">
                {dayAppts.slice(0, 3).map((a) => (
                  <button
                    key={a.id}
                    onClick={() => onEdit(a)}
                    className="block w-full truncate rounded border-l-2 bg-ice/70 px-1 text-left text-[10px] hover:bg-ice"
                    style={{ borderLeftColor: a.professional_color }}
                  >
                    {timeLabel(a.start_at)} {a.patient_name}
                  </button>
                ))}
                {dayAppts.length > 3 && (
                  <span className="block px-1 text-[10px] text-gray-400">+{dayAppts.length - 3} más</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Agenda ---------------- */

function AgendaView({
  professionalsById,
  appointments,
  onEdit,
}: {
  professionalsById: Map<string, Professional>;
  appointments: AppointmentFull[];
  onEdit: (a: AppointmentFull) => void;
}) {
  const groups = useMemo(() => {
    const map = new Map<string, AppointmentFull[]>();
    for (const a of appointments) {
      const key = formatInTimeZone(new Date(a.start_at), CLINIC_TZ, "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    for (const list of map.values()) list.sort((a, b) => a.start_at.localeCompare(b.start_at));
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [appointments]);

  if (groups.length === 0) {
    return <p className="py-16 text-center text-gray-400">No hay citas en este periodo.</p>;
  }

  return (
    <div className="space-y-4">
      {groups.map(([key, list]) => (
        <div key={key}>
          <h3 className="mb-2 font-display text-sm font-bold capitalize text-navy">
            {timeLabel(rangeStartISO(key), "EEEE d 'de' MMMM")}
          </h3>
          <div className="space-y-1.5">
            {list.map((a) => (
              <button
                key={a.id}
                onClick={() => onEdit(a)}
                className="flex w-full items-center gap-3 rounded-lg border border-gray-100 border-l-4 bg-white px-3 py-2 text-left shadow-sm hover:bg-ice"
                style={{ borderLeftColor: a.professional_color }}
              >
                <span className="w-12 shrink-0 font-mono text-sm text-navy">{timeLabel(a.start_at)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-navy">{a.patient_name}</span>
                  <span className="block truncate text-xs text-gray-500">
                    {a.service_name} · {professionalsById.get(a.professional_id ?? "")?.name ?? a.professional_name}
                  </span>
                </span>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${APPOINTMENT_STATUS_COLORS[a.status]}`}
                >
                  {APPOINTMENT_STATUS_LABELS[a.status]}
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
