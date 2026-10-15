'use server'

import { requireAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { uploadProductImages, uploadVideo } from '@/lib/supabase/storage'
import { revalidatePath } from 'next/cache'
import type { Banner } from './types'

async function checkAdmin() {
  await requireAdmin()
}

function clampOpacity(value: number): number {
  if (Number.isNaN(value)) return 65
  return Math.min(100, Math.max(0, value))
}

function clampPercent(value: number, fallback: number): number {
  if (Number.isNaN(value)) return fallback
  return Math.min(100, Math.max(0, value))
}

function normalizeHex(value: unknown, fallback: string): string {
  const raw = typeof value === 'string' ? value.trim() : ''
  return /^#[0-9a-fA-F]{6}$/.test(raw) ? raw : fallback
}

export async function getBanners(): Promise<Banner[]> {
  try { await checkAdmin() } catch { return [] }
  const supabase = createAdminClient()
  const { data } = await supabase.from('banners').select('*').order('sort_order', { ascending: true })
  if (!data) return []
  const banners = data as any[]
  if (banners.length > 0 && banners[0].text_x === undefined) {
    banners.forEach((b: any) => { b.text_x = 50; b.text_y = 50 })
  }
  banners.forEach((b: any) => {
    if (!b.gradient_color) b.gradient_color = '#0B1D3A'
    if (!b.gradient_color_2) b.gradient_color_2 = '#0891B2'
    if (b.gradient_opacity === undefined || b.gradient_opacity === null) b.gradient_opacity = 65
    if (b.gradient_start === undefined || b.gradient_start === null) b.gradient_start = 0
    if (b.gradient_end === undefined || b.gradient_end === null) b.gradient_end = 100
  })
  return banners as Banner[]
}

export async function createBanner(formData: FormData) {
  try {
    try { await checkAdmin() } catch { return { error: 'Unauthorized' } }
    const supabase = createAdminClient()
    const title = formData.get('title') as string
    if (!title) return { error: 'Title required' }

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

    let videoUrl = (formData.get('video_url') as string) || null
    const videoFiles = formData.getAll('video') as File[]
    if (videoFiles.length > 0 && videoFiles[0].size > 0) {
      try {
        videoUrl = await uploadVideo(videoFiles[0])
      } catch (e: any) {
        return { error: `Video upload failed: ${e.message}` }
      }
    }

    const { count } = await supabase.from('banners').select('*', { count: 'exact', head: true })

    const text_x = parseInt(formData.get('text_x') as string) || 50
    const text_y = parseInt(formData.get('text_y') as string) || 50
    const videoStart = formData.get('video_start') ? parseInt(formData.get('video_start') as string) || 0 : null
    const videoEnd = formData.get('video_end') ? parseInt(formData.get('video_end') as string) || null : null

    const gradientColor = normalizeHex(formData.get('gradient_color'), '#0B1D3A')
    const gradientColor2 = normalizeHex(formData.get('gradient_color_2'), '#0891B2')
    const gradientOpacity = clampOpacity(parseInt(formData.get('gradient_opacity') as string))
    const gradientStart = clampPercent(parseInt(formData.get('gradient_start') as string), 0)
    const gradientEnd = clampPercent(parseInt(formData.get('gradient_end') as string), 100)

    const { error } = await supabase.from('banners').insert({
      title,
      subtitle: (formData.get('subtitle') as string) || null,
      description: (formData.get('description') as string) || null,
      image_url: imageUrl,
      link_url: (formData.get('link_url') as string) || null,
      link_label: (formData.get('link_label') as string) || null,
      active: formData.get('active') !== 'false',
      sort_order: (count ?? 0) + 1,
      text_x,
      text_y,
      gradient_color: gradientColor,
      gradient_color_2: gradientColor2,
      gradient_opacity: gradientOpacity,
      gradient_start: gradientStart,
      gradient_end: gradientEnd,
      video_url: videoUrl,
      video_start: videoStart,
      video_end: videoEnd,
    })

    if (error) return { error: error.message }
    revalidatePath('/admin/banners')
    revalidatePath('/')
    return { success: true }
  } catch (e: any) {
    return { error: e?.message || 'Server error' }
  }
}

export async function updateBanner(id: string, formData: FormData) {
  try {
    try { await checkAdmin() } catch { return { error: 'Unauthorized' } }
    const supabase = createAdminClient()
    const title = formData.get('title') as string
    if (!title) return { error: 'Title required' }

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

    let videoUrl = (formData.get('video_url') as string) || null
    const videoFiles = formData.getAll('video') as File[]
    if (videoFiles.length > 0 && videoFiles[0].size > 0) {
      try {
        videoUrl = await uploadVideo(videoFiles[0])
      } catch (e: any) {
        return { error: `Video upload failed: ${e.message}` }
      }
    }

    const text_x = parseInt(formData.get('text_x') as string) || 50
    const text_y = parseInt(formData.get('text_y') as string) || 50
    const videoStart = formData.get('video_start') ? parseInt(formData.get('video_start') as string) || 0 : null
    const videoEnd = formData.get('video_end') ? parseInt(formData.get('video_end') as string) || null : null

    const gradientColor = normalizeHex(formData.get('gradient_color'), '#0B1D3A')
    const gradientColor2 = normalizeHex(formData.get('gradient_color_2'), '#0891B2')
    const gradientOpacity = clampOpacity(parseInt(formData.get('gradient_opacity') as string))
    const gradientStart = clampPercent(parseInt(formData.get('gradient_start') as string), 0)
    const gradientEnd = clampPercent(parseInt(formData.get('gradient_end') as string), 100)

    const update: Record<string, any> = {
      title,
      subtitle: (formData.get('subtitle') as string) || null,
      description: (formData.get('description') as string) || null,
      link_url: (formData.get('link_url') as string) || null,
      link_label: (formData.get('link_label') as string) || null,
      active: formData.get('active') !== 'false',
      text_x,
      text_y,
      gradient_color: gradientColor,
      gradient_color_2: gradientColor2,
      gradient_opacity: gradientOpacity,
      gradient_start: gradientStart,
      gradient_end: gradientEnd,
      video_start: videoStart,
      video_end: videoEnd,
    }
    if (imageUrl) update.image_url = imageUrl
    else if (formData.has('image_url')) update.image_url = ''
    if (videoUrl !== undefined) update.video_url = videoUrl

    const { error } = await supabase.from('banners').update(update).eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/admin/banners')
    revalidatePath('/')
    return { success: true }
  } catch (e: any) {
    return { error: e?.message || 'Server error' }
  }
}

export async function deleteBanner(id: string) {
  try {
    try { await checkAdmin() } catch { return { error: 'Unauthorized' } }
    const supabase = createAdminClient()
    const { error } = await supabase.from('banners').delete().eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/admin/banners')
    revalidatePath('/')
    return { success: true }
  } catch (e: any) {
    return { error: e?.message || 'Server error' }
  }
}

export async function reorderBanners(ids: string[]) {
  try {
    try { await checkAdmin() } catch { return { error: 'Unauthorized' } }
    const supabase = createAdminClient()
    for (let i = 0; i < ids.length; i++) {
      await supabase.from('banners').update({ sort_order: i + 1 }).eq('id', ids[i])
    }
    revalidatePath('/admin/banners')
    revalidatePath('/')
    return { success: true }
  } catch (e: any) {
    return { error: e?.message || 'Server error' }
  }
}

export async function toggleBannerActive(id: string, active: boolean) {
  try {
    try { await checkAdmin() } catch { return { error: 'Unauthorized' } }
    const supabase = createAdminClient()
    const { error } = await supabase.from('banners').update({ active }).eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/admin/banners')
    revalidatePath('/')
    return { success: true }
  } catch (e: any) {
    return { error: e?.message || 'Server error' }
  }
}
