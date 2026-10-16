export type AppointmentStatus =
  | "pendiente"
  | "confirmada"
  | "completada"
  | "cancelada"
  | "no_asistio";

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  completada: "Completada",
  cancelada: "Cancelada",
  no_asistio: "No asistió",
};

export const APPOINTMENT_STATUS_OPTIONS: { value: AppointmentStatus; label: string }[] = [
  { value: "pendiente", label: "Pendiente" },
  { value: "confirmada", label: "Confirmada" },
  { value: "completada", label: "Completada" },
  { value: "cancelada", label: "Cancelada" },
  { value: "no_asistio", label: "No asistió" },
];

export const APPOINTMENT_STATUS_COLORS: Record<AppointmentStatus, string> = {
  pendiente: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  confirmada: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  completada: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  cancelada: "bg-gray-400/15 text-gray-500 border-gray-400/30",
  no_asistio: "bg-red-500/15 text-red-600 border-red-500/30",
};

export interface Professional {
  id: string;
  user_id: string | null;
  name: string;
  slug: string | null;
  color: string;
  specialty: string | null;
  cubicle: string;
  active: boolean;
  bookable: boolean;
  sort_order: number;
}

export interface BookingService {
  id: string;
  name: string;
  slug: string | null;
  duration_minutes: number;
  price_cents: number;
  color: string | null;
  description: string | null;
  active: boolean;
  sort_order: number;
}

export interface Availability {
  id: string;
  professional_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  active: boolean;
}

export interface TimeOff {
  id: string;
  professional_id: string | null;
  start_at: string;
  end_at: string;
  all_day: boolean;
  reason: string | null;
  recurrence: RecurrenceFreq;
  recurrence_interval: number;
  recurrence_weekdays: number[];
  recurrence_until: string | null;
  /** Fechas base de la serie (para editar la serie desde una ocurrencia expandida). */
  base_start_at?: string;
  base_end_at?: string;
}

export type RecurrenceFreq = "none" | "daily" | "weekly" | "monthly";

export const RECURRENCE_OPTIONS: { value: RecurrenceFreq; label: string }[] = [
  { value: "none", label: "No se repite" },
  { value: "daily", label: "Diariamente" },
  { value: "weekly", label: "Semanalmente" },
  { value: "monthly", label: "Mensualmente" },
];

export const WEEKDAY_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
export const WEEKDAY_LONG = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export interface Appointment {
  id: string;
  professional_id: string | null;
  service_id: string | null;
  patient_name: string;
  patient_email: string | null;
  patient_phone: string | null;
  notes: string | null;
  start_at: string;
  end_at: string;
  status: AppointmentStatus;
  source: "web" | "manual";
  cubicle: string;
  user_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** Cita con datos resueltos para el calendario. */
export interface AppointmentFull extends Appointment {
  professional_name: string;
  professional_color: string;
  service_name: string;
  service_duration: number;
}

export interface Slot {
  /** ISO UTC de la hora de inicio. */
  start: string;
  /** ISO UTC de la hora de fin. */
  end: string;
  /** Profesionales libres en esa franja (para asignación automática). */
  professionalIds: string[];
}

/** Valor especial para "cualquier profesional disponible". */
export const ANY_PROFESSIONAL = "any";

/** Cubículos del centro (se pueden ampliar desde Configuración). */
export const CUBICLES = ["Atlas", "Axis", "C3", "C4", "C5", "C6", "C7", "GYM"] as const;
