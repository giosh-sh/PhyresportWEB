'use client'

import { useEffect, useState } from 'react'
import { Image as ImageIcon, Plus, Trash2, Edit, Eye, EyeOff, Users, Mail, Phone, Download, Upload } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  getCourses, createCourse, updateCourse, deleteCourse, toggleCourseActive,
  reorderCourses, getCourseRegistrations, updateRegistrationStatus, deleteRegistration,
} from '@/lib/admin/courses'
import {
  REGISTRATION_STATUS_LABELS, REGISTRATION_STATUS_OPTIONS,
  type AdminCourse, type CourseRegistration, type RegistrationStatus,
} from '@/lib/admin/types'
import { toast } from 'sonner'
import MediaPicker from '@/components/admin/MediaPicker'
import PageHeader from '@/components/admin/PageHeader'

export default function CursosAdminPage() {
  const [courses, setCourses] = useState<AdminCourse[]>([])
  const [registrations, setRegistrations] = useState<CourseRegistration[]>([])
  const [loading, setLoading] = useState(true)

  const [showDialog, setShowDialog] = useState(false)
  const [editCourse, setEditCourse] = useState<AdminCourse | null>(null)
  const [deleteCourseId, setDeleteCourseId] = useState<string | null>(null)
  const [deleteRegId, setDeleteRegId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [mediaPicker, setMediaPicker] = useState(false)

  const [formTitle, setFormTitle] = useState('')
  const [formSlug, setFormSlug] = useState('')
  const [formDate, setFormDate] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formProgramPdf, setFormProgramPdf] = useState('')
  const [formImagePreview, setFormImagePreview] = useState('')
  const [formImage, setFormImage] = useState<File | null>(null)
  const [formActive, setFormActive] = useState(true)

  const [filterCourse, setFilterCourse] = useState<string>('all')

  async function load() {
    try {
      const [cs, regs] = await Promise.all([getCourses(), getCourseRegistrations()])
      setCourses(cs)
      setRegistrations(regs)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount
  useEffect(() => { load() }, [])

  function openAdd() {
    setEditCourse(null)
    setFormTitle('')
    setFormSlug('')
    setFormDate('')
    setFormDescription('')
    setFormProgramPdf('')
    setFormImagePreview('')
    setFormImage(null)
    setFormActive(true)
    setShowDialog(true)
  }

  function openEdit(c: AdminCourse) {
    setEditCourse(c)
    setFormTitle(c.title)
    setFormSlug(c.slug)
    setFormDate(c.date)
    setFormDescription(c.description)
    setFormProgramPdf(c.program_pdf)
    setFormImagePreview(c.image_full_url || c.image_url)
    setFormImage(null)
    setFormActive(c.active)
    setShowDialog(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formTitle.trim()) { toast.error('El título es obligatorio'); return }
    setSaving(true)
    const fd = new FormData()
    fd.append('title', formTitle)
    fd.append('slug', formSlug)
    fd.append('date', formDate)
    fd.append('description', formDescription)
    fd.append('program_pdf', formProgramPdf)
    fd.append('active', String(formActive))
    if (formImage) fd.append('image', formImage)
    else if (formImagePreview) {
      fd.append('image_url', formImagePreview)
      fd.append('image_full_url', formImagePreview)
    }

    try {
      const res = editCourse ? await updateCourse(editCourse.id, fd) : await createCourse(fd)
      if (!res || res.error) {
        toast.error(res?.error || 'Algo salió mal')
      } else {
        toast.success(editCourse ? 'Curso actualizado' : 'Curso creado')
        setShowDialog(false)
        setEditCourse(null)
        load()
      }
    } catch (e: any) {
      toast.error(e?.message || 'Algo salió mal')
    }
    setSaving(false)
  }

  async function handleDeleteCourse(id: string) {
    const res = await deleteCourse(id)
    if (res.error) toast.error(res.error)
    else { toast.success('Curso eliminado'); setCourses((p) => p.filter((c) => c.id !== id)) }
    setDeleteCourseId(null)
  }

  async function handleToggle(c: AdminCourse) {
    const res = await toggleCourseActive(c.id, !c.active)
    if (res.error) toast.error(res.error)
    else setCourses((p) => p.map((x) => (x.id === c.id ? { ...x, active: !x.active } : x)))
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= courses.length) return
    const list = [...courses]
    ;[list[index], list[target]] = [list[target], list[index]]
    setCourses(list)
    reorderCourses(list.map((c) => c.id))
  }

  async function handleStatus(id: string, status: RegistrationStatus) {
    const res = await updateRegistrationStatus(id, status)
    if (res.error) toast.error(res.error)
    else setRegistrations((p) => p.map((r) => (r.id === id ? { ...r, status } : r)))
  }

  async function handleDeleteReg(id: string) {
    const res = await deleteRegistration(id)
    if (res.error) toast.error(res.error)
    else { toast.success('Inscripción eliminada'); setRegistrations((p) => p.filter((r) => r.id !== id)) }
    setDeleteRegId(null)
  }

  const filteredRegs = filterCourse === 'all'
    ? registrations
    : registrations.filter((r) => r.course_id === filterCourse)

  function exportCsv() {
    const header = ['Curso', 'Nombre', 'Email', 'Teléfono', 'Mensaje', 'Estado', 'Fecha']
    const rows = filteredRegs.map((r) => [
      r.course_title,
      r.name,
      r.email,
      r.phone,
      (r.message || '').replace(/\n/g, ' '),
      REGISTRATION_STATUS_LABELS[r.status],
      new Date(r.created_at).toLocaleString('es-ES'),
    ])
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'inscripciones-cursos.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />)}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cursos"
        description="Gestiona los cursos, su portada y las inscripciones recibidas"
        action={<Button onClick={openAdd}><Plus size={16} className="mr-2" /> Añadir curso</Button>}
      />

      <Tabs defaultValue="cursos">
        <TabsList>
          <TabsTrigger value="cursos">Cursos ({courses.length})</TabsTrigger>
          <TabsTrigger value="inscripciones">Inscripciones ({registrations.length})</TabsTrigger>
        </TabsList>

        {/* CURSOS */}
        <TabsContent value="cursos" className="mt-4">
          {courses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <ImageIcon size={28} className="text-muted-foreground/60 mb-4" />
                <h3 className="text-lg font-medium mb-1">Aún no hay cursos</h3>
                <p className="text-sm text-muted-foreground max-w-md mb-4">
                  Crea tu primer curso para poder recibir inscripciones.
                </p>
                <Button onClick={openAdd}><Plus size={16} className="mr-2" /> Añadir curso</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {courses.map((c, i) => (
                <Card key={c.id} className={`border-l-4 ${c.active ? 'border-l-admin-success/50' : 'border-l-admin-slate/30'}`}>
                  <CardContent className="p-4 lg:p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center gap-1 pt-1">
                        <button onClick={() => move(i, -1)} disabled={i === 0} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30">▲</button>
                        <span className="text-[11px] font-mono text-muted-foreground">{i + 1}</span>
                        <button onClick={() => move(i, 1)} disabled={i === courses.length - 1} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30">▼</button>
                      </div>
                      <div className="w-32 h-20 lg:w-48 lg:h-28 rounded bg-muted overflow-hidden flex-shrink-0">
                        {c.image_url || c.image_full_url ? (
                          <img src={c.image_full_url || c.image_url} alt={c.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><ImageIcon size={24} className="text-muted-foreground" /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <h3 className="text-sm lg:text-xl font-semibold truncate">{c.title}</h3>
                          <Badge variant="outline" className={`text-[10px] flex-shrink-0 ${c.active ? 'bg-admin-success/10 text-admin-success' : 'bg-admin-slate/10 text-admin-slate'}`}>
                            {c.active ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </div>
                        <p className="text-xs lg:text-sm text-teal mt-1">{c.date}</p>
                        <p className="text-xs lg:text-sm text-muted-foreground/70 mt-1 line-clamp-2">{c.description}</p>
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                          <Users size={13} /> {c.registration_count ?? 0} inscripciones
                        </p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => handleToggle(c)} className="h-8 w-8 p-0">
                          {c.active ? <EyeOff size={16} /> : <Eye size={16} />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(c)} className="h-8 w-8 p-0">
                          <Edit size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteCourseId(c.id)} className="h-8 w-8 p-0 text-destructive">
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* INSCRIPCIONES */}
        <TabsContent value="inscripciones" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">Todos los cursos</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={filteredRegs.length === 0}>
              <Download size={14} className="mr-1.5" /> Exportar CSV
            </Button>
          </div>

          {filteredRegs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Users size={28} className="text-muted-foreground/60 mb-4" />
                <h3 className="text-lg font-medium mb-1">Sin inscripciones</h3>
                <p className="text-sm text-muted-foreground">Las inscripciones a cursos aparecerán aquí.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredRegs.map((r) => (
                <Card key={r.id}>
                  <CardContent className="p-4 lg:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-sm lg:text-base">{r.name}</h3>
                          <Badge variant="outline" className="text-[10px]">{r.course_title || 'Curso'}</Badge>
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs lg:text-sm text-muted-foreground">
                          <a href={`mailto:${r.email}`} className="flex items-center gap-1.5 hover:text-foreground"><Mail size={13} /> {r.email}</a>
                          {r.phone && <a href={`tel:${r.phone}`} className="flex items-center gap-1.5 hover:text-foreground"><Phone size={13} /> {r.phone}</a>}
                          <span>{new Date(r.created_at).toLocaleString('es-ES')}</span>
                        </div>
                        {r.message && <p className="mt-2 text-sm text-muted-foreground whitespace-pre-line">{r.message}</p>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <select
                          value={r.status}
                          onChange={(e) => handleStatus(r.id, e.target.value as RegistrationStatus)}
                          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                        >
                          {REGISTRATION_STATUS_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteRegId(r.id)} className="h-9 w-9 p-0 text-destructive">
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Course dialog */}
      <Dialog open={showDialog} onOpenChange={(o) => !o && (setShowDialog(false), setEditCourse(null))}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editCourse ? 'Editar curso' : 'Nuevo curso'}</DialogTitle>
            <DialogDescription>Configura la portada, la fecha y los datos del curso.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Portada del curso</Label>
              <div className="mt-1 flex gap-3 items-start">
                {formImagePreview && (
                  <div className="w-32 h-20 rounded border border-border overflow-hidden flex-shrink-0">
                    <img src={formImage ? URL.createObjectURL(formImage) : formImagePreview} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 flex flex-col gap-1.5">
                  <label className="h-10 rounded border border-dashed border-border flex items-center justify-center cursor-pointer hover:bg-accent/10 transition-colors">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Upload size={12} /> {formImage ? 'Cambiar imagen' : formImagePreview ? 'Reemplazar imagen' : 'Subir imagen'}
                    </span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setFormImage(f) }} />
                  </label>
                  <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => setMediaPicker(true)}>
                    <ImageIcon size={11} className="mr-1.5" /> Explorar medios
                  </Button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="title">Título *</Label>
                <Input id="title" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="date">Fecha</Label>
                <Input id="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} placeholder="Septiembre 2026" />
              </div>
            </div>
            <div>
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input id="slug" value={formSlug} onChange={(e) => setFormSlug(e.target.value)} placeholder="se-genera-del-titulo" />
            </div>
            <div>
              <Label htmlFor="description">Descripción</Label>
              <textarea
                id="description"
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="program_pdf">URL del programa (PDF)</Label>
              <Input id="program_pdf" value={formProgramPdf} onChange={(e) => setFormProgramPdf(e.target.value)} placeholder="https://..." />
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={formActive} onChange={(e) => setFormActive(e.target.checked)} className="rounded border-input" />
              <span className="text-sm">Activo</span>
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => (setShowDialog(false), setEditCourse(null))}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : editCourse ? 'Actualizar' : 'Crear'}</Button>
            </DialogFooter>
          </form>
          <MediaPicker
            open={mediaPicker}
            onClose={() => setMediaPicker(false)}
            onSelect={(url) => { setFormImagePreview(url); setFormImage(null) }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete course */}
      <Dialog open={!!deleteCourseId} onOpenChange={(o) => !o && setDeleteCourseId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar curso</DialogTitle>
            <DialogDescription>¿Estás seguro? Se eliminará el curso (las inscripciones se conservan sin curso asociado).</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteCourseId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteCourseId && handleDeleteCourse(deleteCourseId)}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete registration */}
      <Dialog open={!!deleteRegId} onOpenChange={(o) => !o && setDeleteRegId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar inscripción</DialogTitle>
            <DialogDescription>¿Estás seguro? Esta acción no se puede deshacer.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteRegId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteRegId && handleDeleteReg(deleteRegId)}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
