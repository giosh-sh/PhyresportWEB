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
  type TimeOff,
} from "@/lib/citas/types";
import { getAppointmentsBetween, getTimeOffBetween, rescheduleAppointment } from "@/lib/citas/actions";
import { AppointmentDialog } from "./AppointmentDialog";
import { AvailabilityManager } from "./AvailabilityManager";
import { ConfigManager } from "./ConfigManager";
import { TimeOffDialog } from "./TimeOffDialog";

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

/** Minutos desde medianoche (en la zona del centro), limitados a la rejilla visible. */
function minutesOfDay(iso: string): number {
  const m = Number(timeLabel(iso, "H")) * 60 + Number(timeLabel(iso, "m"));
  return m;
}
function clampGridMinute(m: number): number {
  return Math.min(GRID_END_HOUR * 60, Math.max(GRID_START_HOUR * 60, m));
}

interface LaneInput {
  start: number;
  end: number;
}
/** Coloca elementos solapados en carriles para no taparse. */
function layoutLanes<T extends LaneInput>(items: T[]): (T & { lane: number; lanes: number })[] {
  const sorted = [...items].sort((a, b) => a.start - b.start || a.end - b.end);
  const laneEnds: number[] = [];
  const placed = sorted.map((it) => {
    let lane = laneEnds.findIndex((end) => end <= it.start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(it.end);
    } else {
      laneEnds[lane] = it.end;
    }
    return { ...it, lane };
  });
  const lanes = Math.max(1, laneEnds.length);
  return placed.map((p) => ({ ...p, lanes }));
}

export function CitasDashboard({
  professionals,
  services,
  currentProfessionalId,
  isAdmin = false,
}: {
  professionals: Professional[];
  services: BookingService[];
  currentProfessionalId: string | null;
  isAdmin?: boolean;
}) {
  const [tab, setTab] = useState("agenda");
  const [view, setView] = useState<ViewMode>("week");
  const [cursorKey, setCursorKey] = useState(dateKey(new Date()));
  const [proFilter, setProFilter] = useState<string>(currentProfessionalId || "all");
  const [resourceView, setResourceView] = useState(true);
  const [showTeamBlocks, setShowTeamBlocks] = useState(true);
  const [appointments, setAppointments] = useState<AppointmentFull[]>([]);
  const [timeOffs, setTimeOffs] = useState<TimeOff[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AppointmentFull | null>(null);
  const [defaultPro, setDefaultPro] = useState<string | null>(null);
  const [defaultStart, setDefaultStart] = useState<string | null>(null);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<TimeOff | null>(null);

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
      const [appts, offs] = await Promise.all([
        getAppointmentsBetween(range.start, range.end),
        getTimeOffBetween(range.start, range.end),
      ]);
      setAppointments(appts);
      setTimeOffs(offs);
    } catch {
      setAppointments([]);
      setTimeOffs([]);
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

  const visibleTimeOffs = useMemo(() => {
    return timeOffs.filter((t) => {
      if (proFilter !== "all" && t.professional_id && t.professional_id !== proFilter) return false;
      if (isAdmin) return true;
      if (!t.professional_id) return true; // bloqueo de todo el centro
      if (t.professional_id === currentProfessionalId) return true;
      return showTeamBlocks; // bloqueos de compañeros (solo lectura)
    });
  }, [timeOffs, proFilter, isAdmin, currentProfessionalId, showTeamBlocks]);

  const canEditAppointment = (a: AppointmentFull) =>
    isAdmin || (!!currentProfessionalId && a.professional_id === currentProfessionalId);

  const canEditBlock = (t: TimeOff) =>
    isAdmin || (!!currentProfessionalId && t.professional_id === currentProfessionalId);

  function openCreate(professionalId?: string | null, startISO?: string | null) {
    setEditing(null);
    setDefaultPro(professionalId ?? (proFilter !== "all" ? proFilter : professionals[0]?.id ?? null));
    setDefaultStart(startISO ?? null);
    setDialogOpen(true);
  }
  function openEdit(appt: AppointmentFull) {
    if (!canEditAppointment(appt)) {
      toast.info("Solo puedes gestionar tus propias citas.");
      return;
    }
    setEditing(appt);
    setDialogOpen(true);
  }
  function openBlock(t: TimeOff) {
    setEditingBlock(t);
    setBlockDialogOpen(true);
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const data = over.data.current as { professionalId?: string; startISO?: string } | undefined;
    if (!data?.startISO) return;
    const appt = appointments.find((a) => a.id === active.id);
    if (!appt) return;
    // En la semana el destino no cambia de profesional (solo la hora); en el día sí.
    const professionalId = data.professionalId ?? appt.professional_id;
    if (!professionalId) {
      toast.error("Asigna un profesional a la cita primero.");
      return;
    }
    if (appt.professional_id === professionalId && appt.start_at === data.startISO) return;
    if (!canEditAppointment(appt)) {
      toast.error("Solo puedes mover tus propias citas.");
      return;
    }

    // Actualización optimista: mueve la cita al instante, sin recargar.
    const previous = appointments;
    const durationMs = appt.service_duration * 60_000;
    const optimistic: AppointmentFull = {
      ...appt,
      professional_id: professionalId,
      professional_name:
        professionals.find((p) => p.id === professionalId)?.name ?? appt.professional_name,
      professional_color:
        professionals.find((p) => p.id === professionalId)?.color ?? appt.professional_color,
      start_at: data.startISO,
      end_at: new Date(new Date(data.startISO).getTime() + durationMs).toISOString(),
    };
    setAppointments((list) => list.map((a) => (a.id === appt.id ? optimistic : a)));

    const res = await rescheduleAppointment(String(active.id), professionalId, data.startISO);
    if (res.error) {
      toast.error(res.error);
      setAppointments(previous);
      return;
    }
    toast.success("Cita reprogramada");
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
          {isAdmin && <TabsTrigger value="configuracion">Configuración</TabsTrigger>}
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

                {!isAdmin && (
                  <label
                    className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600"
                    title="Ver los huecos bloqueados por tus compañeros (solo lectura)"
                  >
                    <input
                      type="checkbox"
                      checked={showTeamBlocks}
                      onChange={(e) => setShowTeamBlocks(e.target.checked)}
                    />
                    Ver bloqueos del equipo
                  </label>
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
                    timeOffs={visibleTimeOffs}
                    professionalsById={professionalsById}
                    onEdit={openEdit}
                    onCreate={openCreate}
                    onBlockClick={openBlock}
                  />
                </DndContext>
              ) : view === "week" ? (
                <DndContext sensors={sensors} onDragEnd={onDragEnd}>
                  <WeekView
                    cursorKey={cursorKey}
                    professionalsById={professionalsById}
                    appointments={visibleAppointments}
                    timeOffs={visibleTimeOffs}
                    onEdit={openEdit}
                    onCreate={openCreate}
                    onBlockClick={openBlock}
                    defaultProfessionalId={proFilter === "all" ? null : proFilter}
                    onPickDay={(k) => {
                      setCursorKey(k);
                      setView("day");
                    }}
                  />
                </DndContext>
              ) : view === "month" ? (
                <MonthView
                  cursorKey={cursorKey}
                  appointments={visibleAppointments}
                  timeOffs={visibleTimeOffs}
                  professionalsById={professionalsById}
                  onEdit={openEdit}
                  onCreate={openCreate}
                  onBlockClick={openBlock}
                  defaultProfessionalId={proFilter === "all" ? null : proFilter}
                  onPickDay={(k) => {
                    setCursorKey(k);
                    setView("day");
                  }}
                />
              ) : (
                <AgendaView
                  professionalsById={professionalsById}
                  appointments={visibleAppointments}
                  timeOffs={visibleTimeOffs}
                  onEdit={openEdit}
                  onBlockClick={openBlock}
                />
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="disponibilidad" className="mt-4">
          <AvailabilityManager
            professionals={professionals}
            lockedProfessionalId={isAdmin ? null : currentProfessionalId}
          />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="configuracion" className="mt-4">
            <ConfigManager />
          </TabsContent>
        )}
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

      <TimeOffDialog
        open={blockDialogOpen}
        onClose={() => setBlockDialogOpen(false)}
        onSaved={load}
        timeOff={editingBlock}
        professionals={professionals}
        canEdit={editingBlock ? canEditBlock(editingBlock) : false}
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

function WeekSlot({ startISO, onCreate }: { startISO: string; onCreate: () => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: `wslot|${startISO}`, data: { startISO } });
  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onCreate}
      className={`block w-full border-b border-gray-100 transition-colors ${isOver ? "bg-teal/10" : "hover:bg-teal/5"}`}
      style={{ height: ROW_HEIGHT }}
    />
  );
}

function DraggableWeekChip({
  appt,
  top,
  height,
  left,
  width,
  proName,
  onEdit,
}: {
  appt: AppointmentFull;
  top: number;
  height: number;
  left: string;
  width: string;
  proName: string;
  onEdit: (a: AppointmentFull) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: appt.id,
    data: { appt },
  });
  return (
    <button
      ref={setNodeRef}
      style={{
        top,
        height,
        left,
        width,
        borderLeftColor: appt.professional_color,
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        opacity: isDragging ? 0.6 : 1,
        zIndex: isDragging ? 40 : 10,
      }}
      className="absolute cursor-grab overflow-hidden rounded border border-gray-100 border-l-4 bg-white px-1.5 py-0.5 text-left shadow-sm hover:bg-ice active:cursor-grabbing"
      {...attributes}
      {...listeners}
      onClick={() => onEdit(appt)}
    >
      <span className="block truncate text-[10px] font-semibold text-navy">
        {timeLabel(appt.start_at)} {appt.patient_name}
      </span>
      <span className="block truncate text-[10px] text-gray-400">{proName}</span>
    </button>
  );
}

function TimeOffBlock({
  timeOff,
  professionalsById,
  top,
  height,
  lane,
  lanes,
  onClick,
}: {
  timeOff: TimeOff;
  professionalsById: Map<string, Professional>;
  top: number;
  height: number;
  lane?: number;
  lanes?: number;
  onClick?: () => void;
}) {
  const name = timeOff.professional_id
    ? professionalsById.get(timeOff.professional_id)?.name ?? "Profesional"
    : "Todo el centro";
  const left = lane != null && lanes ? `${(lane * 100) / lanes}%` : "0%";
  const width = lanes ? `${100 / lanes}%` : "100%";
  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      className={`absolute z-0 overflow-hidden rounded border border-dashed border-red-300 bg-red-100/80 px-1.5 py-0.5 ${
        onClick ? "cursor-pointer hover:bg-red-200" : ""
      }`}
      style={{ top, height, left, width }}
      title={`${name}${timeOff.reason ? ` · ${timeOff.reason}` : ""}`}
    >
      <span className="block truncate text-[10px] font-semibold text-red-600 line-through">{name}</span>
      {timeOff.reason && (
        <span className="block truncate text-[10px] text-red-500 line-through">{timeOff.reason}</span>
      )}
    </div>
  );
}

function DayView({
  cursorKey,
  professionals: pros,
  appointments,
  timeOffs,
  professionalsById,
  onEdit,
  onCreate,
  onBlockClick,
}: {
  cursorKey: string;
  professionals: Professional[];
  appointments: AppointmentFull[];
  timeOffs: TimeOff[];
  professionalsById: Map<string, Professional>;
  onEdit: (a: AppointmentFull) => void;
  onCreate: (professionalId?: string | null, startISO?: string | null) => void;
  onBlockClick: (t: TimeOff) => void;
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
            const colOffs = timeOffs.filter(
              (t) => !t.professional_id || t.professional_id === pro?.id
            );
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
                {/* bloqueos (horas restringidas) */}
                {colOffs.map((t, i) => {
                  const start = clampGridMinute(minutesOfDay(t.start_at));
                  const rawEnd = minutesOfDay(t.end_at);
                  const end = clampGridMinute(rawEnd > start ? rawEnd : start + 30);
                  const top = ((start - GRID_START_HOUR * 60) / ROW_MINUTES) * ROW_HEIGHT;
                  const height = Math.max(24, ((end - start) / ROW_MINUTES) * ROW_HEIGHT - 2);
                  return (
                    <TimeOffBlock
                      key={`${t.id}-${i}`}
                      timeOff={t}
                      professionalsById={professionalsById}
                      top={top}
                      height={height}
                      onClick={() => onBlockClick(t)}
                    />
                  );
                })}
                {/* appointments */}
                {colAppts.map((a) => {
                  const mins = minutesOfDay(a.start_at);
                  const top = ((mins - GRID_START_HOUR * 60) / ROW_MINUTES) * ROW_HEIGHT;
                  const height = Math.max(28, (a.service_duration / ROW_MINUTES) * ROW_HEIGHT - 2);
                  return (
                    <div key={a.id} className="absolute inset-x-0 z-10" style={{ top, height }}>
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
  timeOffs,
  onEdit,
  onCreate,
  onBlockClick,
  defaultProfessionalId,
  onPickDay,
}: {
  cursorKey: string;
  professionalsById: Map<string, Professional>;
  appointments: AppointmentFull[];
  timeOffs: TimeOff[];
  onEdit: (a: AppointmentFull) => void;
  onCreate: (professionalId?: string | null, startISO?: string | null) => void;
  onBlockClick: (t: TimeOff) => void;
  defaultProfessionalId: string | null;
  onPickDay: (key: string) => void;
}) {
  const start = startOfWeekKey(cursorKey);
  const days = Array.from({ length: 7 }, (_, i) => addDaysKey(start, i));
  const today = dateKey(new Date());

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[860px]">
        {/* Header: días en horizontal */}
        <div className="flex">
          <div className="w-14 shrink-0" />
          {days.map((k) => (
            <button
              key={k}
              onClick={() => onPickDay(k)}
              className={`flex-1 border-l border-gray-100 py-2 text-center hover:bg-ice ${k === today ? "bg-teal/5" : ""}`}
            >
              <span className="block text-[11px] uppercase text-gray-400">
                {timeLabel(rangeStartISO(k), "EEE")}
              </span>
              <span
                className={`mx-auto mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-sm font-semibold ${
                  k === today ? "bg-teal text-white" : "text-navy"
                }`}
              >
                {Number(k.slice(8, 10))}
              </span>
            </button>
          ))}
        </div>

        {/* Grid: horas en vertical, días en horizontal */}
        <div className="flex">
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

          {days.map((k) => {
            const dayAppts = appointments.filter(
              (a) => formatInTimeZone(new Date(a.start_at), CLINIC_TZ, "yyyy-MM-dd") === k
            );
            const dayOffs = timeOffs.filter(
              (t) => formatInTimeZone(new Date(t.start_at), CLINIC_TZ, "yyyy-MM-dd") === k
            );

            type Item = {
              key: string;
              start: number;
              end: number;
              kind: "appt" | "off";
              appt?: AppointmentFull;
              off?: TimeOff;
            };
            const items: Item[] = [
              ...dayAppts.map((a) => ({
                key: `a-${a.id}`,
                start: clampGridMinute(minutesOfDay(a.start_at)),
                end: clampGridMinute(minutesOfDay(a.start_at) + a.service_duration),
                kind: "appt" as const,
                appt: a,
              })),
              ...dayOffs.map((t, i) => {
                const s = clampGridMinute(minutesOfDay(t.start_at));
                const rawEnd = minutesOfDay(t.end_at);
                return {
                  key: `o-${t.id}-${i}`,
                  start: s,
                  end: clampGridMinute(rawEnd > s ? rawEnd : s + 30),
                  kind: "off" as const,
                  off: t,
                };
              }),
            ];
            const placed = layoutLanes(items);

            return (
              <div key={k} className="relative flex-1 border-l border-gray-100">
                <div>
                  {Array.from({ length: ROWS }).map((_, i) => {
                    const minutes = GRID_START_HOUR * 60 + i * ROW_MINUTES;
                    const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
                    const mm = String(minutes % 60).padStart(2, "0");
                    const iso = zonedDateTimeToUtc(k, `${hh}:${mm}`).toISOString();
                    return (
                      <WeekSlot
                        key={i}
                        startISO={iso}
                        onCreate={() => onCreate(defaultProfessionalId, iso)}
                      />
                    );
                  })}
                </div>

                {placed.map((item) => {
                  const top = ((item.start - GRID_START_HOUR * 60) / ROW_MINUTES) * ROW_HEIGHT;
                  const height = Math.max(22, ((item.end - item.start) / ROW_MINUTES) * ROW_HEIGHT - 2);
                  const left = `${(item.lane * 100) / item.lanes}%`;
                  const width = `${100 / item.lanes}%`;

                  if (item.kind === "appt" && item.appt) {
                    const a = item.appt;
                    return (
                      <DraggableWeekChip
                        key={item.key}
                        appt={a}
                        top={top}
                        height={height}
                        left={left}
                        width={width}
                        proName={
                          professionalsById.get(a.professional_id ?? "")?.name ?? a.professional_name
                        }
                        onEdit={onEdit}
                      />
                    );
                  }

                  return (
                    <TimeOffBlock
                      key={item.key}
                      timeOff={item.off!}
                      professionalsById={professionalsById}
                      top={top}
                      height={height}
                      lane={item.lane}
                      lanes={item.lanes}
                      onClick={() => onBlockClick(item.off!)}
                    />
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

/* ---------------- Month ---------------- */

function MonthView({
  cursorKey,
  appointments,
  timeOffs,
  professionalsById,
  onEdit,
  onCreate,
  onBlockClick,
  defaultProfessionalId,
  onPickDay,
}: {
  cursorKey: string;
  appointments: AppointmentFull[];
  timeOffs: TimeOff[];
  professionalsById: Map<string, Professional>;
  onEdit: (a: AppointmentFull) => void;
  onCreate: (professionalId?: string | null, startISO?: string | null) => void;
  onBlockClick: (t: TimeOff) => void;
  defaultProfessionalId: string | null;
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
          const dayOffs = timeOffs.filter(
            (t) => formatInTimeZone(new Date(t.start_at), CLINIC_TZ, "yyyy-MM-dd") === k
          );
          return (
            <div
              key={k}
              onClick={() => onCreate(defaultProfessionalId, zonedDateTimeToUtc(k, "10:00").toISOString())}
              className={`min-h-[92px] cursor-pointer border-b border-r border-gray-100 p-1 transition-colors hover:bg-teal/5 ${inMonth ? "" : "bg-gray-50/60"}`}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPickDay(k);
                }}
                title="Ver el día"
                className={`mb-0.5 text-[11px] font-semibold ${
                  k === today ? "flex h-5 w-5 items-center justify-center rounded-full bg-teal text-white" : "text-gray-500 hover:text-teal"
                }`}
              >
                {Number(k.slice(8, 10))}
              </button>
              <div className="space-y-0.5">
                {dayAppts.slice(0, 3).map((a) => (
                  <button
                    key={a.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(a);
                    }}
                    className="block w-full truncate rounded border-l-2 bg-ice/70 px-1 text-left text-[10px] hover:bg-ice"
                    style={{ borderLeftColor: a.professional_color }}
                  >
                    {timeLabel(a.start_at)} {a.patient_name}
                  </button>
                ))}
                {dayAppts.length > 3 && (
                  <span className="block px-1 text-[10px] text-gray-400">+{dayAppts.length - 3} más</span>
                )}
                {dayOffs.slice(0, 2).map((t, i) => (
                  <button
                    key={`${t.id}-${i}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onBlockClick(t);
                    }}
                    className="block w-full truncate rounded bg-red-100 px-1 text-left text-[10px] font-medium text-red-600 line-through hover:bg-red-200"
                  >
                    {t.professional_id
                      ? professionalsById.get(t.professional_id)?.name ?? "Bloqueo"
                      : "Todo el centro"}
                  </button>
                ))}
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
  timeOffs,
  onEdit,
  onBlockClick,
}: {
  professionalsById: Map<string, Professional>;
  appointments: AppointmentFull[];
  timeOffs: TimeOff[];
  onEdit: (a: AppointmentFull) => void;
  onBlockClick: (t: TimeOff) => void;
}) {
  const groups = useMemo(() => {
    const map = new Map<
      string,
      { start: string; kind: "appt" | "off"; appt?: AppointmentFull; off?: TimeOff }[]
    >();
    for (const a of appointments) {
      const key = formatInTimeZone(new Date(a.start_at), CLINIC_TZ, "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({ start: a.start_at, kind: "appt", appt: a });
    }
    for (const t of timeOffs) {
      const key = formatInTimeZone(new Date(t.start_at), CLINIC_TZ, "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({ start: t.start_at, kind: "off", off: t });
    }
    for (const list of map.values()) list.sort((a, b) => a.start.localeCompare(b.start));
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [appointments, timeOffs]);

  if (groups.length === 0) {
    return <p className="py-16 text-center text-gray-400">No hay citas ni bloqueos en este periodo.</p>;
  }

  return (
    <div className="space-y-4">
      {groups.map(([key, list]) => (
        <div key={key}>
          <h3 className="mb-2 font-display text-sm font-bold capitalize text-navy">
            {timeLabel(rangeStartISO(key), "EEEE d 'de' MMMM")}
          </h3>
          <div className="space-y-1.5">
            {list.map((item, idx) => {
              if (item.kind === "appt" && item.appt) {
                const a = item.appt;
                return (
                  <button
                    key={`a-${a.id}`}
                    onClick={() => onEdit(a)}
                    className="flex w-full items-center gap-3 rounded-lg border border-gray-100 border-l-4 bg-white px-3 py-2 text-left shadow-sm hover:bg-ice"
                    style={{ borderLeftColor: a.professional_color }}
                  >
                    <span className="w-12 shrink-0 font-mono text-sm text-navy">{timeLabel(a.start_at)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-navy">{a.patient_name}</span>
                      <span className="block truncate text-xs text-gray-500">
                        {a.service_name} ·{" "}
                        {professionalsById.get(a.professional_id ?? "")?.name ?? a.professional_name}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${APPOINTMENT_STATUS_COLORS[a.status]}`}
                    >
                      {APPOINTMENT_STATUS_LABELS[a.status]}
                    </span>
                  </button>
                );
              }
              const t = item.off!;
              const name = t.professional_id
                ? professionalsById.get(t.professional_id)?.name ?? "Profesional"
                : "Todo el centro";
              return (
                <button
                  key={`off-${t.id}-${idx}`}
                  onClick={() => onBlockClick(t)}
                  className="flex w-full items-center gap-3 rounded-lg border border-dashed border-red-300 bg-red-100/80 px-3 py-2 text-left hover:bg-red-200"
                >
                  <span className="w-12 shrink-0 font-mono text-sm text-red-500 line-through">
                    {timeLabel(t.start_at)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-red-600 line-through">{name}</span>
                    <span className="block truncate text-xs text-red-500 line-through">
                      {t.reason || "Bloqueo de agenda"}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full border border-red-300 bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-600">
                    Bloqueo
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
