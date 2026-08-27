'use client'

import { useEffect, useState } from 'react'
import { Image as ImageIcon, Plus, Trash2, Edit, Eye, EyeOff, GripVertical } from 'lucide-react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  getSliderImages, createSliderImage, updateSliderImage, deleteSliderImage, toggleSliderImageActive, reorderSliderImages,
} from '@/lib/admin/slider'
import type { SliderImage } from '@/lib/admin/slider'
import MediaPicker from '@/components/admin/MediaPicker'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function SliderPage() {
  const [data, setData] = useState<SliderImage[]>([])
  const [loading, setLoading] = useState(true)
  const [editItem, setEditItem] = useState<SliderImage | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [formTitle, setFormTitle] = useState('')
  const [formLinkUrl, setFormLinkUrl] = useState('')
  const [formImage, setFormImage] = useState<File | null>(null)
  const [formImagePreview, setFormImagePreview] = useState('')
  const [formActive, setFormActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mediaPicker, setMediaPicker] = useState(false)
  const [dragId, setDragId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  async function load() {
    try {
      const images = await getSliderImages()
      setData(images)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount via async load()
  useEffect(() => { load() }, [])

  function openAdd() {
    setEditItem(null)
    setFormTitle('')
    setFormLinkUrl('')
    setFormImage(null)
    setFormImagePreview('')
    setFormActive(true)
    setShowAdd(true)
  }

  function openEdit(s: SliderImage) {
    setEditItem(s)
    setFormTitle(s.title)
    setFormLinkUrl(s.link_url ?? '')
    setFormImage(null)
    setFormImagePreview(s.image_url)
    setFormActive(s.active)
    setShowAdd(true)
  }

  async function handleSave() {
    if (!formImage && !formImagePreview) {
      toast.error('La imagen es obligatoria')
      return
    }
    setSaving(true)
    try {
      const fd = new FormData()
      fd.set('title', formTitle)
      fd.set('link_url', formLinkUrl)
      fd.set('active', String(formActive))
      if (formImage) {
        fd.set('image', formImage)
      } else if (formImagePreview && !editItem) {
        fd.set('image_url', formImagePreview)
      }

      const res = editItem
        ? await updateSliderImage(editItem.id, fd)
        : await createSliderImage(fd)

      if (res.error) toast.error(res.error)
      else {
        toast.success(editItem ? 'Imagen actualizada' : 'Imagen añadida')
        setShowAdd(false)
        load()
      }
    } catch (e: any) {
      toast.error(e.message ?? 'Error')
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    const res = await deleteSliderImage(id)
    if (res.error) toast.error(res.error)
    else {
      toast.success('Imagen eliminada')
      setDeleteId(null)
      load()
    }
  }

  async function handleToggle(s: SliderImage) {
    const res = await toggleSliderImageActive(s.id, !s.active)
    if (res.error) toast.error(res.error)
    else load()
  }

  async function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId) {
      setDragId(null)
      setOverId(null)
      return
    }

    const ids = data.map((s) => s.id)
    const from = ids.indexOf(dragId)
    const to = ids.indexOf(targetId)
    if (from < 0 || to < 0) {
      setDragId(null)
      setOverId(null)
      return
    }

    ids.splice(to, 0, ids.splice(from, 1)[0])
    const nextData = ids
      .map((id) => data.find((s) => s.id === id))
      .filter((s): s is SliderImage => !!s)
    setData(nextData)
    setDragId(null)
    setOverId(null)

    const res = await reorderSliderImages(ids)
    if (res.error) {
      toast.error(res.error)
      load()
    } else {
      toast.success('Orden actualizado')
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 w-48 bg-muted rounded" />
        <div className="h-72 bg-muted rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display tracking-wider text-foreground">Slider</h1>
        <Button onClick={openAdd}><Plus size={16} className="mr-2" /> Añadir imagen</Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Las imágenes del slider se muestran en la sección &quot;Sobre nosotros&quot;, justo debajo del hero principal.
      </p>

      <Card>
        <CardContent className="p-0 divide-y divide-border">
          {data.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              Aún no hay imágenes en el slider. Añade la primera.
            </div>
          )}
          {data.map((s) => (
            <div
              key={s.id}
              className={cn(
                'flex items-center justify-between py-3 px-4 rounded-lg hover:bg-accent/5 transition-colors cursor-grab active:cursor-grabbing select-none',
                dragId === s.id && 'opacity-40',
                overId === s.id && 'ring-2 ring-primary/50',
              )}
              draggable
              onDragStart={(e) => {
                setDragId(s.id)
                e.dataTransfer.effectAllowed = 'move'
              }}
              onDragOver={(e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
                setOverId(s.id)
              }}
              onDragLeave={() => setOverId((o) => (o === s.id ? null : o))}
              onDrop={(e) => {
                e.preventDefault()
                handleDrop(s.id)
              }}
              onDragEnd={() => { setDragId(null); setOverId(null) }}
            >
              <div className="flex items-center gap-3">
                <GripVertical size={16} className="text-muted-foreground/50 shrink-0" />
                <div className="w-24 h-16 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0">
                  {s.image_url ? (
                    <Image
                      src={s.image_url}
                      alt={s.title || 'Slide'}
                      width={96}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon size={20} className="text-muted-foreground" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{s.title || 'Sin título'}</span>
                    {!s.active && <Badge variant="outline" className="text-[10px]">Oculta</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">Posición {s.sort_order}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggle(s)}
                  className="text-muted-foreground hover:text-foreground p-1.5"
                  title={s.active ? 'Ocultar' : 'Mostrar'}
                >
                  {s.active ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button onClick={() => openEdit(s)} className="text-muted-foreground hover:text-foreground p-1.5">
                  <Edit size={16} />
                </button>
                <button onClick={() => setDeleteId(s.id)} className="text-muted-foreground hover:text-destructive p-1.5">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={showAdd} onOpenChange={(o) => !o && setShowAdd(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? 'Editar imagen' : 'Nueva imagen del slider'}</DialogTitle>
            <DialogDescription>
              Sube una foto que aparecerá en el slider debajo del hero principal.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="slider_title">Título (opcional)</Label>
              <Input
                id="slider_title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Ej: Instalaciones de Phyresport"
              />
            </div>

            <div>
              <Label>Imagen *</Label>
              <div className="mt-1 flex items-center gap-3">
                {formImagePreview && (
                  <div className="w-24 h-16 rounded border border-border overflow-hidden">
                    <Image
                      src={formImagePreview}
                      alt=""
                      width={96}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <label className="flex-1 h-10 rounded border border-dashed border-input flex items-center justify-center cursor-pointer hover:bg-accent/10 text-xs text-muted-foreground">
                  {formImage ? formImage.name : formImagePreview ? 'Cambiar imagen' : 'Subir imagen'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setFormImage(file)
                        setFormImagePreview(URL.createObjectURL(file))
                      }
                    }}
                  />
                </label>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full mt-2 h-9 text-xs"
                onClick={() => setMediaPicker(true)}
              >
                <ImageIcon size={14} className="mr-1.5" />
                Elegir de la biblioteca de medios
              </Button>
            </div>

            <div>
              <Label htmlFor="slider_link">Enlace (opcional)</Label>
              <Input
                id="slider_link"
                value={formLinkUrl}
                onChange={(e) => setFormLinkUrl(e.target.value)}
                placeholder="/servicios/fisioterapia"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="slider_active"
                checked={formActive}
                onChange={(e) => setFormActive(e.target.checked)}
                className="rounded border-input"
              />
              <Label htmlFor="slider_active" className="mb-0">Visible en el slider</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : editItem ? 'Actualizar' : 'Añadir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar imagen</DialogTitle>
            <DialogDescription>
              Esta imagen se eliminará del slider. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MediaPicker
        open={mediaPicker}
        onClose={() => setMediaPicker(false)}
        onSelect={(url) => {
          setFormImage(null)
          setFormImagePreview(url)
          setMediaPicker(false)
        }}
      />
    </div>
  )
}