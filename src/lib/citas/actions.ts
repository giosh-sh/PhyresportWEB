"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { getUserRole, requireStaff } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  computeDaySlots,
  dateKeyInTz,
  pickBalancedProfessional,
  zonedDateTimeToUtc,
} from "./slots";
import { expandTimeOff } from "./recurrence";
import {
  ANY_PROFESSIONAL,
  type AppointmentFull,
  type AppointmentStatus,
  type Availability,
  type BookingService,
  type Professional,
  type RecurrenceFreq,
  type Slot,
  type TimeOff,
} from "./types";
import { sendBookingConfirmation, sendBookingNotification } from "./emails";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function nextDateKey(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function mapAppointment(row: any): AppointmentFull {
  return {
    ...row,
    professional_name: row.professionals?.name ?? "Sin asignar",
    professional_color: row.professionals?.color ?? "#64748B",
    service_name: row.booking_services?.name ?? "Servicio",
    service_duration: row.booking_services?.duration_minutes ?? 60,
  };
}

async function professionalForUser(userId: string): Promise<{ id: string } | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as { id: string }) ?? null;
}

/** Hay otra cita activa en el mismo cubículo que solapa con el rango. */
async function cubicleConflictExists(
  cubicle: string,
  startISO: string,
  endISO: string,
  excludeId?: string
): Promise<boolean> {
  if (!cubicle) return false;
  const supabase = createAdminClient();
  let q = supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("cubicle", cubicle)
    .neq("status", "cancelada")
    .lt("start_at", endISO)
    .gt("end_at", startISO);
  if (excludeId) q = q.neq("id", excludeId);
  const { count } = await q;
  return (count ?? 0) > 0;
}

/** Días de cierre del centro (por defecto: sábado y domingo). */
async function readClosedWeekdays(): Promise<number[]> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "clinic")
      .maybeSingle();
    const value = (data?.value ?? {}) as { closed_weekdays?: number[] };
    return Array.isArray(value.closed_weekdays) ? value.closed_weekdays : [0, 6];
  } catch {
    return [0, 6];
  }
}

/** Horas recomendadas dentro del horario del profesional y con el cubículo libre. */
async function computeSuggestions(
  professionalId: string,
  startISO: string,
  durationMinutes: number,
  cubicle: string,
  excludeId?: string
): Promise<string[]> {
  const supabase = createAdminClient();
  const date = dateKeyInTz(new Date(startISO));
  const dayStart = zonedDateTimeToUtc(date, "00:00").toISOString();
  const dayEnd = zonedDateTimeToUtc(nextDateKey(date), "00:00").toISOString();

  const [availRes, apptRes, timeOff] = await Promise.all([
    supabase
      .from("availability")
      .select("*")
      .eq("professional_id", professionalId)
      .eq("active", true),
    supabase
      .from("appointments")
      .select("id,professional_id,start_at,end_at,cubicle")
      .neq("status", "cancelada")
      .gte("start_at", dayStart)
      .lt("start_at", dayEnd),
    loadTimeOffOccurrences(dayStart, dayEnd),
  ]);

  const appts = ((apptRes.data ?? []) as any[]).filter((a) => a.id !== excludeId);
  const slots = computeDaySlots({
    date,
    durationMinutes,
    professionalIds: [professionalId],
    availability: (availRes.data ?? []) as Availability[],
    appointments: appts.filter((a) => a.professional_id === professionalId),
    timeOff,
    closedWeekdays: await readClosedWeekdays(),
  });

  const durationMs = durationMinutes * 60_000;
  const free = slots.filter((s) => {
    const sMs = new Date(s.start).getTime();
    return !appts.some(
      (a) =>
        cubicle &&
        a.cubicle === cubicle &&
        new Date(a.start_at).getTime() < sMs + durationMs &&
        new Date(a.end_at).getTime() > sMs
    );
  });
  return free.slice(0, 5).map((s) => s.start);
}
async function canManageAppointment(userId: string, appointmentId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  if (role === "admin") return true;
  const pro = await professionalForUser(userId);
  if (!pro) return false;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("appointments")
    .select("professional_id")
    .eq("id", appointmentId)
    .maybeSingle();
  return (data as { professional_id: string | null } | null)?.professional_id === pro.id;
}

/** Bloqueos (incluidas las recurrencias) que caen dentro del rango. */
async function loadTimeOffOccurrences(startISO: string, endISO: string): Promise<TimeOff[]> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("time_off").select("*");
  const series = (data ?? []) as TimeOff[];
  const startMs = new Date(startISO).getTime();
  const endMs = new Date(endISO).getTime();
  const out: TimeOff[] = [];
  for (const s of series) {
    if ((s.recurrence ?? "none") === "none") {
      if (new Date(s.end_at).getTime() > startMs && new Date(s.start_at).getTime() < endMs) {
        out.push({ ...s, base_start_at: s.start_at, base_end_at: s.end_at });
      }
      continue;
    }
    for (const iv of expandTimeOff(s, startMs, endMs)) {
      out.push({
        ...s,
        base_start_at: s.start_at,
        base_end_at: s.end_at,
        start_at: new Date(iv.start).toISOString(),
        end_at: new Date(iv.end).toISOString(),
      });
    }
  }
  return out.sort((a, b) => a.start_at.localeCompare(b.start_at));
}

/* ============================================================
   Consultas (staff)
   ============================================================ */

export async function getProfessionals(includeInactive = false): Promise<Professional[]> {
  try {
    await requireStaff();
  } catch {
    return [];
  }
  const supabase = createAdminClient();
  let query = supabase.from("professionals").select("*").order("sort_order", { ascending: true });
  if (!includeInactive) query = query.eq("active", true);
  const { data } = await query;
  return (data ?? []) as Professional[];
}

export async function getBookingServices(includeInactive = false): Promise<BookingService[]> {
  try {
    await requireStaff();
  } catch {
    return [];
  }
  const supabase = createAdminClient();
  let query = supabase.from("booking_services").select("*").order("sort_order", { ascending: true });
  if (!includeInactive) query = query.eq("active", true);
  const { data } = await query;
  return (data ?? []) as BookingService[];
}

export async function getAppointmentsBetween(
  startISO: string,
  endISO: string,
  professionalId?: string | null
): Promise<AppointmentFull[]> {
  try {
    await requireStaff();
  } catch {
    return [];
  }
  const supabase = createAdminClient();
  let query = supabase
    .from("appointments")
    .select("*, professionals(name,color), booking_services(name,duration_minutes)")
    .gte("start_at", startISO)
    .lt("start_at", endISO)
    .order("start_at", { ascending: true });
  if (professionalId) query = query.eq("professional_id", professionalId);
  const { data } = await query;
  return (data ?? []).map(mapAppointment);
}

export async function getAvailability(professionalId?: string): Promise<Availability[]> {
  try {
    await requireStaff();
  } catch {
    return [];
  }
  const supabase = createAdminClient();
  let query = supabase.from("availability").select("*").order("weekday", { ascending: true });
  if (professionalId) query = query.eq("professional_id", professionalId);
  const { data } = await query;
  return (data ?? []) as Availability[];
}

export async function getTimeOffBetween(startISO: string, endISO: string): Promise<TimeOff[]> {
  try {
    await requireStaff();
  } catch {
    return [];
  }
  return loadTimeOffOccurrences(startISO, endISO);
}

/** Series de bloqueo sin expandir (para el panel de disponibilidad). */
export async function getTimeOffSeries(): Promise<TimeOff[]> {
  try {
    await requireStaff();
  } catch {
    return [];
  }
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("time_off")
    .select("*")
    .order("start_at", { ascending: false })
    .limit(500);
  return (data ?? []) as TimeOff[];
}

export async function getCurrentProfessional(): Promise<Professional | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const supabase = createAdminClient();
  const { data } = await supabase.from("professionals").select("*").eq("user_id", userId).maybeSingle();
  return (data as Professional) ?? null;
}

/* ============================================================
   Mutaciones (staff)
   ============================================================ */

export interface AppointmentInput {
  professionalId: string;
  serviceId: string;
  startISO: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  notes?: string;
  status?: AppointmentStatus;
  durationMinutes?: number;
  cubicle?: string;
  allowConflict?: boolean;
}

export async function createManualAppointment(
  input: AppointmentInput
): Promise<{
  success?: boolean;
  id?: string;
  error?: string;
  conflict?: boolean;
  message?: string;
  suggestions?: string[];
}> {
  let userId: string;
  try {
    userId = await requireStaff();
  } catch {
    return { error: "Unauthorized" };
  }
  // Un fisio solo puede crear citas en su propia agenda; un admin, en cualquiera.
  const role = await getUserRole(userId);
  let professionalId = input.professionalId;
  if (role !== "admin") {
    const pro = await professionalForUser(userId);
    if (!pro) return { error: "Tu usuario no está vinculado a ningún profesional." };
    professionalId = pro.id;
  }
  if (!professionalId) return { error: "Selecciona un profesional." };
  if (!input.serviceId) return { error: "Selecciona un servicio." };
  if (!input.patientName?.trim()) return { error: "El nombre del paciente es obligatorio." };

  try {
    const supabase = createAdminClient();
  const { data: service } = await supabase
    .from("booking_services")
    .select("duration_minutes")
    .eq("id", input.serviceId)
    .maybeSingle();
  const duration =
    input.durationMinutes && input.durationMinutes > 0
      ? input.durationMinutes
      : service?.duration_minutes ?? 60;

  // Cubículo: el indicado o, si no, el del profesional
  let cubicle = (input.cubicle ?? "").trim();
  if (!cubicle) {
    const { data: pro } = await supabase
      .from("professionals")
      .select("cubicle")
      .eq("id", professionalId)
      .maybeSingle();
    cubicle = ((pro as any)?.cubicle ?? "").trim();
  }

  const endISO = new Date(new Date(input.startISO).getTime() + duration * 60_000).toISOString();
  if (!input.allowConflict && cubicle && (await cubicleConflictExists(cubicle, input.startISO, endISO))) {
    const suggestions = await computeSuggestions(professionalId, input.startISO, duration, cubicle);
    return {
      conflict: true,
      message: `El cubículo ${cubicle} ya está ocupado a esa hora.`,
      suggestions,
    };
  }

  const { data, error } = await supabase.rpc("create_appointment", {
    p_professional_id: professionalId,
    p_service_id: input.serviceId,
    p_start_at: input.startISO,
    p_duration_minutes: duration,
    p_patient_name: input.patientName.trim(),
    p_patient_email: input.patientEmail?.trim() || "",
    p_patient_phone: input.patientPhone?.trim() || "",
    p_notes: input.notes?.trim() || "",
    p_source: "manual",
    p_user_id: null,
    p_created_by: userId,
    p_status: input.status ?? "confirmada",
    p_cubicle: cubicle || null,
  });

  if (error) {
    const msg = error.message || "";
    if (msg.includes("SLOT_TAKEN")) return { error: "Ese hueco ya está ocupado." };
    if (msg.includes("SLOT_BLOCKED")) return { error: "Ese horario está bloqueado." };
    if (msg.includes("CUBICLE_TAKEN")) {
      const suggestions = await computeSuggestions(professionalId, input.startISO, duration, cubicle);
      return { conflict: true, message: `El cubículo ${cubicle} ya está ocupado a esa hora.`, suggestions };
    }
    return { error: msg };
  }

  revalidatePath("/gestioncitas");
  return { success: true, id: data as string };
  } catch (e: any) {
    return { error: e?.message || "Error al crear la cita." };
  }
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus
): Promise<{ success?: boolean; error?: string }> {
  let userId: string;
  try {
    userId = await requireStaff();
  } catch {
    return { error: "Unauthorized" };
  }
  if (!(await canManageAppointment(userId, id))) {
    return { error: "Solo puedes gestionar tus propias citas." };
  }
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("appointments")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/gestioncitas");
  return { success: true };
}

export async function updateAppointmentDetails(
  id: string,
  fields: Partial<Pick<AppointmentInput, "patientName" | "patientEmail" | "patientPhone" | "notes" | "serviceId">>
): Promise<{ success?: boolean; error?: string }> {
  let userId: string;
  try {
    userId = await requireStaff();
  } catch {
    return { error: "Unauthorized" };
  }
  if (!(await canManageAppointment(userId, id))) {
    return { error: "Solo puedes gestionar tus propias citas." };
  }
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (fields.patientName !== undefined) update.patient_name = fields.patientName.trim();
  if (fields.patientEmail !== undefined) update.patient_email = fields.patientEmail.trim();
  if (fields.patientPhone !== undefined) update.patient_phone = fields.patientPhone.trim();
  if (fields.notes !== undefined) update.notes = fields.notes.trim();
  if (fields.serviceId !== undefined) update.service_id = fields.serviceId;
  const supabase = createAdminClient();
  const { error } = await supabase.from("appointments").update(update).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/gestioncitas");
  return { success: true };
}

export async function rescheduleAppointment(
  id: string,
  professionalId: string,
  startISO: string,
  durationMinutes?: number,
  cubicleInput?: string,
  allowConflict?: boolean
): Promise<{
  success?: boolean;
  error?: string;
  conflict?: boolean;
  message?: string;
  suggestions?: string[];
}> {
  let userId: string;
  try {
    userId = await requireStaff();
  } catch {
    return { error: "Unauthorized" };
  }
  if (!(await canManageAppointment(userId, id))) {
    return { error: "Solo puedes mover tus propias citas." };
  }
  try {
  const supabase = createAdminClient();

  let duration = durationMinutes && durationMinutes > 0 ? durationMinutes : 0;
  let currentCubicle = "";
  if (!duration || !cubicleInput) {
    const { data: appt } = await supabase
      .from("appointments")
      .select("cubicle, service_id, booking_services(duration_minutes)")
      .eq("id", id)
      .maybeSingle();
    if (!duration) duration = (appt as any)?.booking_services?.duration_minutes ?? 60;
    currentCubicle = ((appt as any)?.cubicle ?? "").trim();
  }

  let cubicle = (cubicleInput ?? "").trim() || currentCubicle;
  if (!cubicle) {
    const { data: pro } = await supabase
      .from("professionals")
      .select("cubicle")
      .eq("id", professionalId)
      .maybeSingle();
    cubicle = ((pro as any)?.cubicle ?? "").trim();
  }

  const endISO = new Date(new Date(startISO).getTime() + duration * 60_000).toISOString();
  if (
    !allowConflict &&
    cubicle &&
    (await cubicleConflictExists(cubicle, startISO, endISO, id))
  ) {
    const suggestions = await computeSuggestions(professionalId, startISO, duration, cubicle, id);
    return {
      conflict: true,
      message: `El cubículo ${cubicle} ya está ocupado a esa hora.`,
      suggestions,
    };
  }

  const { error } = await supabase.rpc("reschedule_appointment", {
    p_id: id,
    p_professional_id: professionalId,
    p_start_at: startISO,
    p_duration_minutes: duration,
    p_cubicle: cubicle || null,
  });
  if (error) {
    const msg = error.message || "";
    if (msg.includes("SLOT_TAKEN")) return { error: "Ese hueco ya está ocupado." };
    if (msg.includes("SLOT_BLOCKED")) return { error: "Ese horario está bloqueado." };
    if (msg.includes("CUBICLE_TAKEN")) {
      const suggestions = await computeSuggestions(professionalId, startISO, duration, cubicle, id);
      return { conflict: true, message: `El cubículo ${cubicle} ya está ocupado a esa hora.`, suggestions };
    }
    return { error: msg };
  }
  revalidatePath("/gestioncitas");
  return { success: true };
  } catch (e: any) {
    return { error: e?.message || "Error al reprogramar la cita." };
  }
}

export async function deleteAppointment(id: string): Promise<{ success?: boolean; error?: string }> {
  let userId: string;
  try {
    userId = await requireStaff();
  } catch {
    return { error: "Unauthorized" };
  }
  if (!(await canManageAppointment(userId, id))) {
    return { error: "Solo puedes eliminar tus propias citas." };
  }
  const supabase = createAdminClient();
  const { error } = await supabase.from("appointments").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/gestioncitas");
  return { success: true };
}

export async function updateTimeOff(
  id: string,
  input: {
    startISO: string;
    endISO: string;
    allDay?: boolean;
    reason?: string;
    recurrence?: RecurrenceFreq;
    recurrenceInterval?: number;
    recurrenceWeekdays?: number[];
    recurrenceUntil?: string | null;
  }
): Promise<{ success?: boolean; error?: string }> {
  let userId: string;
  try {
    userId = await requireStaff();
  } catch {
    return { error: "Unauthorized" };
  }

  const supabase = createAdminClient();
  const role = await getUserRole(userId);
  if (role !== "admin") {
    const pro = await professionalForUser(userId);
    const { data: row } = await supabase
      .from("time_off")
      .select("professional_id")
      .eq("id", id)
      .maybeSingle();
    if (!pro || row?.professional_id !== pro.id) {
      return { error: "Solo puedes editar tus propios bloqueos." };
    }
  }

  const { error } = await supabase
    .from("time_off")
    .update({
      start_at: input.startISO,
      end_at: input.endISO,
      all_day: input.allDay ?? false,
      reason: input.reason?.trim() || "",
      recurrence: input.recurrence ?? "none",
      recurrence_interval: input.recurrenceInterval ?? 1,
      recurrence_weekdays: input.recurrenceWeekdays ?? [],
      recurrence_until: input.recurrenceUntil || null,
    })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/gestioncitas");
  return { success: true };
}

export async function saveAvailability(
  professionalId: string,
  rows: { weekday: number; start_time: string; end_time: string; active?: boolean }[]
): Promise<{ success?: boolean; error?: string }> {
  try {
    await requireStaff();
  } catch {
    return { error: "Unauthorized" };
  }
  const supabase = createAdminClient();
  const { error: delError } = await supabase
    .from("availability")
    .delete()
    .eq("professional_id", professionalId);
  if (delError) return { error: delError.message };

  if (rows.length > 0) {
    const payload = rows.map((r) => ({
      professional_id: professionalId,
      weekday: r.weekday,
      start_time: r.start_time,
      end_time: r.end_time,
      active: r.active ?? true,
    }));
    const { error } = await supabase.from("availability").insert(payload);
    if (error) return { error: error.message };
  }
  revalidatePath("/gestioncitas");
  return { success: true };
}

export async function addTimeOff(input: {
  professionalId: string | null;
  startISO: string;
  endISO: string;
  allDay?: boolean;
  reason?: string;
  recurrence?: RecurrenceFreq;
  recurrenceInterval?: number;
  recurrenceWeekdays?: number[];
  recurrenceUntil?: string | null;
}): Promise<{ success?: boolean; error?: string; warning?: string }> {
  let userId: string;
  try {
    userId = await requireStaff();
  } catch {
    return { error: "Unauthorized" };
  }

  const role = await getUserRole(userId);
  let professionalId = input.professionalId;
  if (role !== "admin") {
    // Un fisio solo puede bloquear su propia agenda.
    const pro = await professionalForUser(userId);
    if (!pro) return { error: "Tu usuario no está vinculado a ningún profesional." };
    professionalId = pro.id;
  }

  const supabase = createAdminClient();
  const recurrence = input.recurrence ?? "none";
  const until =
    input.recurrenceUntil ||
    (recurrence !== "none"
      ? new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().slice(0, 10)
      : null);

  const payload = {
    professional_id: professionalId,
    start_at: input.startISO,
    end_at: input.endISO,
    all_day: input.allDay ?? false,
    reason: input.reason?.trim() || "",
    recurrence,
    recurrence_interval: input.recurrenceInterval ?? 1,
    recurrence_weekdays: input.recurrenceWeekdays ?? [],
    recurrence_until: until,
  };

  let { error } = await supabase.from("time_off").insert(payload);

  const isSchemaError = (m?: string) =>
    !!m && /(column|schema|pgrst|does not exist|find the)/i.test(m);

  // Si faltan las columnas de recurrencia (migración sin ejecutar), reintenta
  // sin recurrencia para no bloquear al usuario y avisa.
  if (error && isSchemaError(error.message)) {
    console.error("[citas] time_off recurrence insert falló:", error.message, (error as any).code);
    const retry = await supabase.from("time_off").insert({
      professional_id: professionalId,
      start_at: input.startISO,
      end_at: input.endISO,
      all_day: input.allDay ?? false,
      reason: input.reason?.trim() || "",
    });
    if (!retry.error) {
      revalidatePath("/gestioncitas");
      return {
        success: true,
        warning:
          "Bloqueo creado SIN repetición. Para que se repita, ejecuta supabase/phyresport-appointments.sql.",
      };
    }
    console.error("[citas] time_off insert mínimo falló:", retry.error.message, (retry.error as any).code);
    error = retry.error;
  }

  if (error) {
    console.error("[citas] time_off insert error:", error.message, (error as any).code);
    return { error: error.message || "No se pudo crear el bloqueo." };
  }
  revalidatePath("/gestioncitas");
  return { success: true };
}

export async function deleteTimeOff(id: string): Promise<{ success?: boolean; error?: string }> {
  let userId: string;
  try {
    userId = await requireStaff();
  } catch {
    return { error: "Unauthorized" };
  }

  const supabase = createAdminClient();
  const role = await getUserRole(userId);
  if (role !== "admin") {
    const pro = await professionalForUser(userId);
    const { data: row } = await supabase
      .from("time_off")
      .select("professional_id")
      .eq("id", id)
      .maybeSingle();
    if (!pro || row?.professional_id !== pro.id) return { error: "No autorizado" };
  }

  const { error } = await supabase.from("time_off").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/gestioncitas");
  return { success: true };
}

export async function upsertProfessional(input: {
  id?: string;
  name: string;
  color?: string;
  specialty?: string;
  cubicle?: string;
  user_id?: string | null;
  active?: boolean;
  bookable?: boolean;
}): Promise<{ success?: boolean; error?: string; id?: string }> {
  try {
    await requireStaff();
  } catch {
    return { error: "Unauthorized" };
  }
  const supabase = createAdminClient();
  const payload = {
    name: input.name.trim(),
    color: input.color || "#00B8D4",
    specialty: input.specialty || "",
    cubicle: (input.cubicle ?? "").trim(),
    user_id: input.user_id?.trim() || null,
    active: input.active ?? true,
    bookable: input.bookable ?? true,
  };
  if (input.id) {
    const { error } = await supabase.from("professionals").update(payload).eq("id", input.id);
    if (error) return { error: error.message };
    revalidatePath("/gestioncitas");
    return { success: true, id: input.id };
  }
  const { data, error } = await supabase.from("professionals").insert(payload).select("id").single();
  if (error) return { error: error.message };
  revalidatePath("/gestioncitas");
  return { success: true, id: data.id };
}

export async function upsertBookingService(input: {
  id?: string;
  name: string;
  durationMinutes: number;
  priceCents?: number;
  color?: string;
  description?: string;
  active?: boolean;
}): Promise<{ success?: boolean; error?: string; id?: string }> {
  try {
    await requireStaff();
  } catch {
    return { error: "Unauthorized" };
  }
  const supabase = createAdminClient();
  const payload = {
    name: input.name.trim(),
    duration_minutes: input.durationMinutes || 60,
    price_cents: input.priceCents ?? 0,
    color: input.color || "#00B8D4",
    description: input.description || "",
    active: input.active ?? true,
  };
  if (input.id) {
    const { error } = await supabase.from("booking_services").update(payload).eq("id", input.id);
    if (error) return { error: error.message };
    revalidatePath("/gestioncitas");
    return { success: true, id: input.id };
  }
  const { data, error } = await supabase.from("booking_services").insert(payload).select("id").single();
  if (error) return { error: error.message };
  revalidatePath("/gestioncitas");
  return { success: true, id: data.id };
}

/* ============================================================
   Público (/citas)
   ============================================================ */

export async function getClinicSettings(): Promise<{ closedWeekdays: number[] }> {
  try {
    await requireStaff();
  } catch {
    return { closedWeekdays: [0, 6] };
  }
  return { closedWeekdays: await readClosedWeekdays() };
}

export async function saveClinicSettings(
  closedWeekdays: number[]
): Promise<{ success?: boolean; error?: string }> {
  let userId: string;
  try {
    userId = await requireStaff();
  } catch {
    return { error: "Unauthorized" };
  }
  const role = await getUserRole(userId);
  if (role !== "admin") {
    return { error: "Solo un admin puede cambiar los días de cierre." };
  }
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("settings")
    .upsert({ key: "clinic", value: { closed_weekdays: closedWeekdays } }, { onConflict: "key" });
  if (error) return { error: error.message };
  revalidatePath("/gestioncitas");
  return { success: true };
}

export async function getPublicBookingData(): Promise<{
  services: BookingService[];
  professionals: Professional[];
}> {
  const supabase = createAdminClient();
  const [servicesRes, prosRes] = await Promise.all([
    supabase
      .from("booking_services")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("professionals")
      .select("*")
      .eq("active", true)
      .eq("bookable", true)
      .order("sort_order", { ascending: true }),
  ]);
  return {
    services: (servicesRes.data ?? []) as BookingService[],
    professionals: (prosRes.data ?? []) as Professional[],
  };
}

export async function getAvailableSlots(
  date: string,
  serviceId: string,
  professionalId: string
): Promise<Slot[]> {
  const supabase = createAdminClient();

  const { data: service } = await supabase
    .from("booking_services")
    .select("duration_minutes")
    .eq("id", serviceId)
    .maybeSingle();
  const duration = service?.duration_minutes ?? 60;

  const { data: pros } = await supabase
    .from("professionals")
    .select("id")
    .eq("active", true)
    .eq("bookable", true)
    .order("sort_order", { ascending: true });
  const allPros = (pros ?? []) as { id: string }[];

  const professionalIds =
    professionalId && professionalId !== ANY_PROFESSIONAL
      ? [professionalId]
      : allPros.map((p) => p.id);
  if (professionalIds.length === 0) return [];

  const dayStart = zonedDateTimeToUtc(date, "00:00").toISOString();
  const dayEnd = zonedDateTimeToUtc(nextDateKey(date), "00:00").toISOString();

  const [availRes, apptRes, timeOff] = await Promise.all([
    supabase
      .from("availability")
      .select("*")
      .in("professional_id", professionalIds)
      .eq("active", true),
    supabase
      .from("appointments")
      .select("professional_id,start_at,end_at")
      .in("professional_id", professionalIds)
      .neq("status", "cancelada")
      .gte("start_at", dayStart)
      .lt("start_at", dayEnd),
    loadTimeOffOccurrences(dayStart, dayEnd),
  ]);

  return computeDaySlots({
    date,
    durationMinutes: duration,
    professionalIds,
    availability: (availRes.data ?? []) as Availability[],
    appointments: (apptRes.data ?? []) as { professional_id: string | null; start_at: string; end_at: string }[],
    timeOff,
    closedWeekdays: await readClosedWeekdays(),
  });
}

export interface PublicBookingInput {
  serviceId: string;
  professionalId: string; // id o "any"
  startISO: string;
  patientName: string;
  patientEmail: string;
  patientPhone?: string;
  notes?: string;
}

export async function createPublicBooking(
  input: PublicBookingInput
): Promise<{ success?: boolean; professionalName?: string; error?: string }> {
  const name = input.patientName?.trim();
  const email = input.patientEmail?.trim();
  if (!name) return { error: "Indica tu nombre." };
  if (!email || !EMAIL_REGEX.test(email)) return { error: "Indica un email válido." };
  if (!input.startISO) return { error: "Selecciona una hora." };

  const supabase = createAdminClient();

  const { data: service } = await supabase
    .from("booking_services")
    .select("id,name,duration_minutes")
    .eq("id", input.serviceId)
    .maybeSingle();
  if (!service) return { error: "Servicio no disponible." };
  const duration = service.duration_minutes ?? 60;

  let userId: string | null = null;
  try {
    const session = await auth();
    userId = session.userId ?? null;
  } catch {
    userId = null;
  }

  // Determinar candidatos (asignación automática equilibrada si "any")
  let candidateIds: string[];
  if (input.professionalId && input.professionalId !== ANY_PROFESSIONAL) {
    candidateIds = [input.professionalId];
  } else {
    const date = new Date(input.startISO).toISOString().slice(0, 10);
    const slots = await getAvailableSlotsForStart(date, input.serviceId, input.startISO);
    candidateIds = slots;
    if (candidateIds.length === 0) {
      return { error: "Ese hueco ya no está disponible. Elige otra hora." };
    }
  }

  let lastError = "No se pudo crear la cita.";
  for (const professionalId of candidateIds) {
    const { error } = await supabase.rpc("create_appointment", {
      p_professional_id: professionalId,
      p_service_id: input.serviceId,
      p_start_at: input.startISO,
      p_duration_minutes: duration,
      p_patient_name: name,
      p_patient_email: email,
      p_patient_phone: input.patientPhone?.trim() || "",
      p_notes: input.notes?.trim() || "",
      p_source: "web",
      p_user_id: userId,
      p_created_by: null,
      p_status: "pendiente",
    });

    if (!error) {
      const { data: pro } = await supabase
        .from("professionals")
        .select("name")
        .eq("id", professionalId)
        .maybeSingle();
      const professionalName = pro?.name ?? "Profesional";

      const emailData = {
        patientName: name,
        patientEmail: email,
        serviceName: service.name,
        professionalName,
        startAt: input.startISO,
        notes: input.notes,
      };
      await Promise.all([sendBookingConfirmation(emailData), sendBookingNotification(emailData)]);

      revalidatePath("/gestioncitas");
      return { success: true, professionalName };
    }

    const message = error.message || "";
    if (message.includes("SLOT_TAKEN") || message.includes("SLOT_BLOCKED")) {
      lastError = "Ese hueco ya no está disponible. Elige otra hora.";
      continue;
    }
    lastError = message;
    break;
  }

  return { error: lastError };
}

/**
 * Para "cualquier profesional": devuelve los ids de los fisios libres en esa
 * hora concreta, ordenados por carga (asignación equilibrada).
 */
async function getAvailableSlotsForStart(
  date: string,
  serviceId: string,
  startISO: string
): Promise<string[]> {
  const supabase = createAdminClient();
  const { data: service } = await supabase
    .from("booking_services")
    .select("duration_minutes")
    .eq("id", serviceId)
    .maybeSingle();
  const duration = service?.duration_minutes ?? 60;

  const { data: pros } = await supabase
    .from("professionals")
    .select("id")
    .eq("active", true)
    .eq("bookable", true)
    .order("sort_order", { ascending: true });
  const allPros = (pros ?? []) as { id: string }[];
  const professionalIds = allPros.map((p) => p.id);
  if (professionalIds.length === 0) return [];

  const dayStart = zonedDateTimeToUtc(date, "00:00").toISOString();
  const dayEnd = zonedDateTimeToUtc(nextDateKey(date), "00:00").toISOString();

  const [availRes, apptRes, timeOff] = await Promise.all([
    supabase.from("availability").select("*").in("professional_id", professionalIds).eq("active", true),
    supabase
      .from("appointments")
      .select("professional_id,start_at,end_at")
      .in("professional_id", professionalIds)
      .neq("status", "cancelada")
      .gte("start_at", dayStart)
      .lt("start_at", dayEnd),
    loadTimeOffOccurrences(dayStart, dayEnd),
  ]);

  const slots = computeDaySlots({
    date,
    durationMinutes: duration,
    professionalIds,
    availability: (availRes.data ?? []) as Availability[],
    appointments: (apptRes.data ?? []) as { professional_id: string | null; start_at: string; end_at: string }[],
    timeOff,
    closedWeekdays: await readClosedWeekdays(),
  });

  const slot = slots.find((s) => s.start === startISO);
  if (!slot) return [];

  const dayAppointments = (apptRes.data ?? []) as { professional_id: string | null }[];
  const balanced = pickBalancedProfessional(
    slot.professionalIds,
    dayAppointments,
    professionalIds
  );
  if (!balanced) return slot.professionalIds;
  // El elegido primero; el resto como respaldo ante carreras.
  return [balanced, ...slot.professionalIds.filter((id) => id !== balanced)];
}
