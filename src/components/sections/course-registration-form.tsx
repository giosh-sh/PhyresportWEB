"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { submitCourseRegistration, type RegistrationState } from "@/app/cursos/actions";

const initialState: RegistrationState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-teal text-white font-display font-semibold text-sm rounded-full hover:bg-cyan transition-all disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> Enviando…
        </>
      ) : (
        <>
          <Send className="w-4 h-4" aria-hidden /> Enviar inscripción
        </>
      )}
    </button>
  );
}

export function CourseRegistrationForm({
  courseId,
  courseSlug,
  courseTitle,
}: {
  courseId: string;
  courseSlug: string;
  courseTitle: string;
}) {
  const [state, formAction] = useActionState(submitCourseRegistration, initialState);

  if (state.success) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-teal/30 bg-teal/5 px-6 py-10 text-center">
        <CheckCircle2 className="w-10 h-10 text-teal" aria-hidden />
        <h3 className="font-display text-xl font-bold text-navy">¡Inscripción recibida!</h3>
        <p className="text-gray-500 max-w-md">
          Gracias por inscribirte en <strong>{courseTitle}</strong>. Te contactaremos con los
          siguientes pasos lo antes posible.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {/* Campos de contexto del curso */}
      <input type="hidden" name="course_id" value={courseId} />
      <input type="hidden" name="course_slug" value={courseSlug} />
      <input type="hidden" name="course_title" value={courseTitle} />

      {/* Honeypot anti-spam (oculto para personas) */}
      <div className="hidden" aria-hidden>
        <label>
          No rellenar
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-navy">
            Nombre y apellidos *
          </label>
          <input
            id="name"
            name="name"
            required
            autoComplete="name"
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-charcoal outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/20"
            placeholder="Tu nombre"
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-navy">
            Email *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-charcoal outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/20"
            placeholder="tucorreo@email.com"
          />
        </div>
      </div>

      <div>
        <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-navy">
          Teléfono
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-charcoal outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/20"
          placeholder="Opcional"
        />
      </div>

      <div>
        <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-navy">
          Comentarios
        </label>
        <textarea
          id="message"
          name="message"
          rows={3}
          className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-charcoal outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/20"
          placeholder="¿Algo que debamos saber? (opcional)"
        />
      </div>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <SubmitButton />
        <p className="text-xs text-gray-400">
          Al enviar aceptas que te contactemos sobre este curso.
        </p>
      </div>
    </form>
  );
}
