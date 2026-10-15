'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendCourseRegistrationNotification } from '@/lib/admin/notifications'

export interface RegistrationState {
  success?: boolean
  error?: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function submitCourseRegistration(
  _prevState: RegistrationState,
  formData: FormData
): Promise<RegistrationState> {
  // Honeypot anti-spam: si un bot lo rellena, ignoramos silenciosamente.
  if ((formData.get('website') as string)?.trim()) {
    return { success: true }
  }

  const name = ((formData.get('name') as string) || '').trim()
  const email = ((formData.get('email') as string) || '').trim()
  const phone = ((formData.get('phone') as string) || '').trim()
  const message = ((formData.get('message') as string) || '').trim()
  const courseSlug = ((formData.get('course_slug') as string) || '').trim()
  const courseTitle = ((formData.get('course_title') as string) || '').trim()
  const rawCourseId = ((formData.get('course_id') as string) || '').trim()
  const courseId = UUID_REGEX.test(rawCourseId) ? rawCourseId : null

  if (!name) return { error: 'Indica tu nombre.' }
  if (!email || !EMAIL_REGEX.test(email)) return { error: 'Indica un email válido.' }

  let userId: string | null = null
  try {
    const session = await auth()
    userId = session.userId ?? null
  } catch {
    userId = null
  }

  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from('course_registrations').insert({
      course_id: courseId,
      course_slug: courseSlug,
      course_title: courseTitle,
      name,
      email,
      phone,
      message,
      user_id: userId,
      status: 'pending',
    })

    if (error) return { error: 'No se pudo registrar la inscripción. Inténtalo de nuevo.' }

    await sendCourseRegistrationNotification({
      name,
      email,
      phone,
      message,
      courseTitle: courseTitle || 'Curso',
      courseSlug,
    })

    revalidatePath('/admin/cursos')
    return { success: true }
  } catch (e) {
    console.error('[courses] registration error:', e)
    return { error: 'No se pudo registrar la inscripción. Inténtalo de nuevo.' }
  }
}
