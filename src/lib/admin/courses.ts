'use server'

import { requireAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { uploadProductImages } from '@/lib/supabase/storage'
import { revalidatePath } from 'next/cache'
import type { AdminCourse, CourseRegistration, RegistrationStatus } from './types'

async function checkAdmin() {
  await requireAdmin()
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export async function getCourses(): Promise<AdminCourse[]> {
  try {
    await checkAdmin()
  } catch {
    return []
  }
  const supabase = createAdminClient()
  const { data } = await supabase.from('courses').select('*').order('sort_order', { ascending: true })
  const courses = (data ?? []) as AdminCourse[]

  const { data: regs } = await supabase.from('course_registrations').select('course_id')
  const counts = new Map<string, number>()
  for (const r of (regs ?? []) as { course_id: string | null }[]) {
    if (r.course_id) counts.set(r.course_id, (counts.get(r.course_id) ?? 0) + 1)
  }
  return courses.map((c) => ({ ...c, registration_count: counts.get(c.id) ?? 0 }))
}

async function uploadCover(formData: FormData): Promise<{ imageUrl?: string; imageFullUrl?: string; error?: string }> {
  const result: { imageUrl?: string; imageFullUrl?: string; error?: string } = {}
  const cover = formData.get('image') as File | null
  if (cover && cover.size > 0) {
    try {
      const urls = await uploadProductImages([cover])
      result.imageUrl = urls[0]
    } catch (e: any) {
      return { error: `Error subiendo la portada: ${e.message}` }
    }
  }
  const full = formData.get('image_full') as File | null
  if (full && full.size > 0) {
    try {
      const urls = await uploadProductImages([full])
      result.imageFullUrl = urls[0]
    } catch (e: any) {
      return { error: `Error subiendo la imagen completa: ${e.message}` }
    }
  }
  return result
}

export async function createCourse(formData: FormData) {
  try {
    try { await checkAdmin() } catch { return { error: 'Unauthorized' } }
    const supabase = createAdminClient()

    const title = ((formData.get('title') as string) || '').trim()
    if (!title) return { error: 'El título es obligatorio' }

    const slug = ((formData.get('slug') as string) || '').trim() || slugify(title)
    const uploads = await uploadCover(formData)
    if (uploads.error) return { error: uploads.error }

    const imageUrl = uploads.imageUrl || ((formData.get('image_url') as string) || '')
    const imageFullUrl = uploads.imageFullUrl || ((formData.get('image_full_url') as string) || imageUrl)

    const { count } = await supabase.from('courses').select('*', { count: 'exact', head: true })

    const { error } = await supabase.from('courses').insert({
      slug,
      title,
      date: (formData.get('date') as string) || '',
      description: (formData.get('description') as string) || '',
      image_url: imageUrl,
      image_full_url: imageFullUrl,
      program_pdf: (formData.get('program_pdf') as string) || '',
      active: formData.get('active') !== 'false',
      sort_order: count ?? 0,
    })

    if (error) return { error: error.message }
    revalidatePath('/admin/cursos')
    revalidatePath('/cursos')
    return { success: true }
  } catch (e: any) {
    return { error: e?.message || 'Server error' }
  }
}

export async function updateCourse(id: string, formData: FormData) {
  try {
    try { await checkAdmin() } catch { return { error: 'Unauthorized' } }
    const supabase = createAdminClient()

    const title = ((formData.get('title') as string) || '').trim()
    if (!title) return { error: 'El título es obligatorio' }

    const uploads = await uploadCover(formData)
    if (uploads.error) return { error: uploads.error }

    const update: Record<string, any> = {
      title,
      date: (formData.get('date') as string) || '',
      description: (formData.get('description') as string) || '',
      program_pdf: (formData.get('program_pdf') as string) || '',
      active: formData.get('active') !== 'false',
      updated_at: new Date().toISOString(),
    }

    const slug = ((formData.get('slug') as string) || '').trim()
    if (slug) update.slug = slugify(slug)

    if (uploads.imageUrl) update.image_url = uploads.imageUrl
    else if (formData.get('image_url')) update.image_url = formData.get('image_url') as string

    if (uploads.imageFullUrl) update.image_full_url = uploads.imageFullUrl
    else if (formData.get('image_full_url')) update.image_full_url = formData.get('image_full_url') as string

    const { error } = await supabase.from('courses').update(update).eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/admin/cursos')
    revalidatePath('/cursos')
    return { success: true }
  } catch (e: any) {
    return { error: e?.message || 'Server error' }
  }
}

export async function deleteCourse(id: string) {
  try {
    try { await checkAdmin() } catch { return { error: 'Unauthorized' } }
    const supabase = createAdminClient()
    const { error } = await supabase.from('courses').delete().eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/admin/cursos')
    revalidatePath('/cursos')
    return { success: true }
  } catch (e: any) {
    return { error: e?.message || 'Server error' }
  }
}

export async function toggleCourseActive(id: string, active: boolean) {
  try {
    try { await checkAdmin() } catch { return { error: 'Unauthorized' } }
    const supabase = createAdminClient()
    const { error } = await supabase.from('courses').update({ active }).eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/admin/cursos')
    revalidatePath('/cursos')
    return { success: true }
  } catch (e: any) {
    return { error: e?.message || 'Server error' }
  }
}

export async function reorderCourses(ids: string[]) {
  try {
    try { await checkAdmin() } catch { return { error: 'Unauthorized' } }
    const supabase = createAdminClient()
    for (let i = 0; i < ids.length; i++) {
      await supabase.from('courses').update({ sort_order: i }).eq('id', ids[i])
    }
    revalidatePath('/admin/cursos')
    revalidatePath('/cursos')
    return { success: true }
  } catch (e: any) {
    return { error: e?.message || 'Server error' }
  }
}

export async function getCourseRegistrations(courseId?: string): Promise<CourseRegistration[]> {
  try {
    await checkAdmin()
  } catch {
    return []
  }
  const supabase = createAdminClient()
  let query = supabase.from('course_registrations').select('*').order('created_at', { ascending: false })
  if (courseId) query = query.eq('course_id', courseId)
  const { data } = await query
  return (data ?? []) as CourseRegistration[]
}

export async function updateRegistrationStatus(id: string, status: RegistrationStatus) {
  try {
    try { await checkAdmin() } catch { return { error: 'Unauthorized' } }
    const supabase = createAdminClient()
    const { error } = await supabase.from('course_registrations').update({ status }).eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/admin/cursos')
    return { success: true }
  } catch (e: any) {
    return { error: e?.message || 'Server error' }
  }
}

export async function deleteRegistration(id: string) {
  try {
    try { await checkAdmin() } catch { return { error: 'Unauthorized' } }
    const supabase = createAdminClient()
    const { error } = await supabase.from('course_registrations').delete().eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/admin/cursos')
    return { success: true }
  } catch (e: any) {
    return { error: e?.message || 'Server error' }
  }
}
