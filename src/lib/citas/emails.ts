import { Resend } from "resend";
import { render } from "@react-email/components";
import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";
import BaseEmail from "@/emails/BaseEmail";
import { getNotificationSettings } from "@/lib/admin/notifications";
import { CLINIC_TZ } from "./slots";

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Phyresport Web <onboarding@resend.dev>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatDate(iso: string): string {
  return formatInTimeZone(new Date(iso), CLINIC_TZ, "EEEE d 'de' MMMM 'de' yyyy, HH:mm", {
    locale: es,
  });
}

export interface BookingEmailData {
  patientName: string;
  patientEmail: string;
  serviceName: string;
  professionalName: string;
  startAt: string;
  notes?: string;
}

/** Confirmación para el paciente. */
export async function sendBookingConfirmation(data: BookingEmailData): Promise<void> {
  if (!process.env.RESEND_API_KEY || !EMAIL_REGEX.test(data.patientEmail)) return;
  const when = formatDate(data.startAt);
  const content = [
    `Hola ${data.patientName},`,
    "",
    "Hemos recibido tu solicitud de cita:",
    `Servicio: ${data.serviceName}`,
    `Profesional: ${data.professionalName}`,
    `Fecha: ${when}`,
    "",
    "Si necesitas cambiarla, responde a este correo o escríbenos por WhatsApp.",
  ].join("\n");

  try {
    const html = await render(
      BaseEmail({
        title: "Cita solicitada",
        previewText: `Tu cita el ${when}`,
        content,
        ctaText: "Ver la web",
        ctaUrl: APP_URL,
      })
    );
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({ from: FROM_EMAIL, to: data.patientEmail, subject: "Tu cita en Phyresport", html });
  } catch (e) {
    console.error("[citas] confirmation email failed:", e);
  }
}

/** Aviso interno a la clínica. */
export async function sendBookingNotification(data: BookingEmailData): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;

  let to = "info@phyresport.com";
  try {
    const settings = await getNotificationSettings();
    const configured = settings?.notification_email?.trim();
    if (configured && EMAIL_REGEX.test(configured)) to = configured;
  } catch {
    // email por defecto
  }

  const when = formatDate(data.startAt);
  const content = [
    "Nueva cita reservada:",
    `Paciente: ${data.patientName}`,
    `Email: ${data.patientEmail}`,
    `Servicio: ${data.serviceName}`,
    `Profesional: ${data.professionalName}`,
    `Fecha: ${when}`,
    data.notes ? `Notas: ${data.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const html = await render(
      BaseEmail({
        title: "Nueva cita",
        previewText: `${data.patientName} — ${when}`,
        content,
        ctaText: "Ver gestión de citas",
        ctaUrl: `${APP_URL}/gestioncitas`,
      })
    );
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      replyTo: EMAIL_REGEX.test(data.patientEmail) ? data.patientEmail : undefined,
      subject: `Nueva cita — ${data.patientName}`,
      html,
    });
  } catch (e) {
    console.error("[citas] notification email failed:", e);
  }
}
