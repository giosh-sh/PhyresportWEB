'use server'

import { requireAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { uploadProductImages } from '@/lib/supabase/storage'
import { revalidatePath } from 'next/cache'

export interface SliderImage {
  id: string
  title: string
  image_url: string
  link_url: string | null
  sort_order: number
  active: boolean
  created_at: string
}

async function checkAdmin() {
  await requireAdmin()
}

export async function getSliderImages(): Promise<SliderImage[]> {
  try { await checkAdmin() } catch { return [] }
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('slider_images')
    .select('*')
    .order('sort_order', { ascending: true })
  return (data ?? []) as SliderImage[]
}

export async function createSliderImage(formData: FormData) {
  try {
    try { await checkAdmin() } catch { return { error: 'Unauthorized' } }
    const supabase = createAdminClient()
    const title = (formData.get('title') as string) || ''

    let imageUrl = (formData.get('image_url') as string) || ''
    const imageFiles = formData.getAll('image') as File[]
    if (imageFiles.length > 0 && imageFiles[0].size > 0) {
      try {
        const urls = await uploadProductImages([imageFiles[0]])
        imageUrl = urls[0]
      } catch (e: any) {
        return { error: `Image upload failed: ${e.message}` }
      }
    }

    const { count } = await supabase
      .from('slider_images')
      .select('*', { count: 'exact', head: true })

    const { error } = await supabase.from('slider_images').insert({
      title,
      image_url: imageUrl,
      link_url: (formData.get('link_url') as string) || null,
      active: formData.get('active') !== 'false',
      sort_order: (count ?? 0) + 1,
    })

    if (error) return { error: error.message }
    revalidatePath('/admin/slider')
    revalidatePath('/')
    return { success: true }
  } catch (e: any) {
    return { error: e?.message || 'Server error' }
  }
}

export async function updateSliderImage(id: string, formData: FormData) {
  try {
    try { await checkAdmin() } catch { return { error: 'Unauthorized' } }
    const supabase = createAdminClient()

    let imageUrl = (formData.get('image_url') as string) || ''
    const imageFiles = formData.getAll('image') as File[]
    if (imageFiles.length > 0 && imageFiles[0].size > 0) {
      try {
        const urls = await uploadProductImages([imageFiles[0]])
        imageUrl = urls[0]
      } catch (e: any) {
        return { error: `Image upload failed: ${e.message}` }
      }
    }

    const update: Record<string, any> = {
      title: (formData.get('title') as string) || '',
      link_url: (formData.get('link_url') as string) || null,
      active: formData.get('active') !== 'false',
    }
    if (imageUrl) update.image_url = imageUrl

    const { error } = await supabase.from('slider_images').update(update).eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/admin/slider')
    revalidatePath('/')
    return { success: true }
  } catch (e: any) {
    return { error: e?.message || 'Server error' }
  }
}

export async function deleteSliderImage(id: string) {
  try {
    try { await checkAdmin() } catch { return { error: 'Unauthorized' } }
    const supabase = createAdminClient()
    const { error } = await supabase.from('slider_images').delete().eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/admin/slider')
    revalidatePath('/')
    return { success: true }
  } catch (e: any) {
    return { error: e?.message || 'Server error' }
  }
}

export async function reorderSliderImages(ids: string[]) {
  try {
    try { await checkAdmin() } catch { return { error: 'Unauthorized' } }
    const supabase = createAdminClient()
    for (let i = 0; i < ids.length; i++) {
      await supabase.from('slider_images').update({ sort_order: i + 1 }).eq('id', ids[i])
    }
    revalidatePath('/admin/slider')
    revalidatePath('/')
    return { success: true }
  } catch (e: any) {
    return { error: e?.message || 'Server error' }
  }
}

export async function toggleSliderImageActive(id: string, active: boolean) {
  try {
    try { await checkAdmin() } catch { return { error: 'Unauthorized' } }
    const supabase = createAdminClient()
    const { error } = await supabase.from('slider_images').update({ active }).eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/admin/slider')
    revalidatePath('/')
    return { success: true }
  } catch (e: any) {
    return { error: e?.message || 'Server error' }
  }
}