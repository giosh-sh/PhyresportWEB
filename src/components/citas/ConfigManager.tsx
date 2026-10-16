"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Clock, Pencil, Plus, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { BookingService, Professional } from "@/lib/citas/types";
import { CUBICLES } from "@/lib/citas/types";
import {
  getBookingServices,
  getProfessionals,
  upsertBookingService,
  upsertProfessional,
} from "@/lib/citas/actions";

const DEFAULT_COLOR = "#00B8D4";

export function ConfigManager() {
  const router = useRouter();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<BookingService[]>([]);
  const [loading, setLoading] = useState(true);

  const [proOpen, setProOpen] = useState(false);
  const [svcOpen, setSvcOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editingPro, setEditingPro] = useState<Professional | null>(null);
  const [proName, setProName] = useState("");
  const [proColor, setProColor] = useState(DEFAULT_COLOR);
  const [proSpecialty, setProSpecialty] = useState("");
  const [proCubicle, setProCubicle] = useState("");
  const [proUserId, setProUserId] = useState("");
  const [proActive, setProActive] = useState(true);
  const [proBookable, setProBookable] = useState(true);

  const [editingSvc, setEditingSvc] = useState<BookingService | null>(null);
  const [svcName, setSvcName] = useState("");
  const [svcDuration, setSvcDuration] = useState(60);
  const [svcPrice, setSvcPrice] = useState("0");
  const [svcColor, setSvcColor] = useState(DEFAULT_COLOR);
  const [svcDescription, setSvcDescription] = useState("");
  const [svcActive, setSvcActive] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [pros, svcs] = await Promise.all([getProfessionals(true), getBookingServices(true)]);
    setProfessionals(pros);
    setServices(svcs);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount
    load();
  }, [load]);

  function openPro(p: Professional | null) {
    setEditingPro(p);
    setProName(p?.name ?? "");
    setProColor(p?.color ?? DEFAULT_COLOR);
    setProSpecialty(p?.specialty ?? "");
    setProCubicle(p?.cubicle ?? "");
    setProUserId(p?.user_id ?? "");
    setProActive(p?.active ?? true);
    setProBookable(p?.bookable ?? true);
    setProOpen(true);
  }

  async function savePro() {
    if (!proName.trim()) return toast.error("El nombre es obligatorio");
    setSaving(true);
    const res = await upsertProfessional({
      id: editingPro?.id,
      name: proName,
      color: proColor,
      specialty: proSpecialty,
      cubicle: proCubicle,
      user_id: proUserId,
      active: proActive,
      bookable: proBookable,
    });
    setSaving(false);
    if (res.error) return toast.error(res.error);
    toast.success(editingPro ? "Profesional actualizado" : "Profesional creado");
    setProOpen(false);
    load();
    router.refresh();
  }

  function openSvc(s: BookingService | null) {
    setEditingSvc(s);
    setSvcName(s?.name ?? "");
    setSvcDuration(s?.duration_minutes ?? 60);
    setSvcPrice(((s?.price_cents ?? 0) / 100).toString());
    setSvcColor(s?.color ?? DEFAULT_COLOR);
    setSvcDescription(s?.description ?? "");
    setSvcActive(s?.active ?? true);
    setSvcOpen(true);
  }

  async function saveSvc() {
    if (!svcName.trim()) return toast.error("El nombre es obligatorio");
    const priceCents = Math.round((parseFloat(svcPrice.replace(",", ".")) || 0) * 100);
    setSaving(true);
    const res = await upsertBookingService({
      id: editingSvc?.id,
      name: svcName,
      durationMinutes: svcDuration,
      priceCents,
      color: svcColor,
      description: svcDescription,
      active: svcActive,
    });
    setSaving(false);
    if (res.error) return toast.error(res.error);
    toast.success(editingSvc ? "Servicio actualizado" : "Servicio creado");
    setSvcOpen(false);
    load();
    router.refresh();
  }

  if (loading) {
    return <div className="py-16 text-center text-gray-400">Cargando configuración…</div>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Profesionales */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-navy">
            <UserRound className="h-5 w-5 text-teal" /> Profesionales
          </h2>
          <Button size="sm" onClick={() => openPro(null)}>
            <Plus className="mr-1.5 h-4 w-4" /> Añadir
          </Button>
        </div>
        <div className="space-y-2">
          {professionals.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2">
              <span className="h-8 w-8 shrink-0 rounded-full" style={{ backgroundColor: p.color }} />
              <div className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-navy">{p.name}</span>
                <span className="block truncate text-xs text-gray-400">
                  {p.specialty || "Sin especialidad"}
                  {p.cubicle ? ` · ${p.cubicle}` : ""}
                  {p.user_id ? " · cuenta vinculada" : ""}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {!p.active && <Badge variant="outline" className="text-[10px]">Inactivo</Badge>}
                {!p.bookable && <Badge variant="outline" className="text-[10px]">No reservable</Badge>}
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openPro(p)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Servicios */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-navy">
            <Clock className="h-5 w-5 text-teal" /> Servicios
          </h2>
          <Button size="sm" onClick={() => openSvc(null)}>
            <Plus className="mr-1.5 h-4 w-4" /> Añadir
          </Button>
        </div>
        <div className="space-y-2">
          {services.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2">
              <span className="h-8 w-8 shrink-0 rounded-full" style={{ backgroundColor: s.color ?? DEFAULT_COLOR }} />
              <div className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-navy">{s.name}</span>
                <span className="block truncate text-xs text-gray-400">
                  {s.duration_minutes} min · {(s.price_cents / 100).toFixed(2)} €
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {!s.active && <Badge variant="outline" className="text-[10px]">Inactivo</Badge>}
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openSvc(s)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dialog profesional */}
      <Dialog open={proOpen} onOpenChange={(o) => !o && setProOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPro ? "Editar profesional" : "Nuevo profesional"}</DialogTitle>
            <DialogDescription>Datos básicos y vinculación con su cuenta de acceso.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre *</Label>
              <Input value={proName} onChange={(e) => setProName(e.target.value)} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Color</Label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="color"
                    value={proColor}
                    onChange={(e) => setProColor(e.target.value)}
                    className="h-10 w-14 rounded border border-input bg-transparent"
                  />
                  <Input value={proColor} onChange={(e) => setProColor(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Especialidad</Label>
                <Input value={proSpecialty} onChange={(e) => setProSpecialty(e.target.value)} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Cubículo</Label>
              <Input
                list="cubicles-list"
                value={proCubicle}
                onChange={(e) => setProCubicle(e.target.value)}
                placeholder="Atlas, Axis, C3…, GYM"
                className="mt-1"
              />
              <datalist id="cubicles-list">
                {CUBICLES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div>
              <Label>ID de usuario (Clerk)</Label>
              <Input
                value={proUserId}
                onChange={(e) => setProUserId(e.target.value)}
                placeholder="user_xxx (opcional)"
                className="mt-1"
              />
              <p className="mt-1 text-xs text-gray-400">
                Enlázalo para que este fisio vea «Solo mi agenda» al iniciar sesión.
              </p>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={proActive} onChange={(e) => setProActive(e.target.checked)} />
                Activo
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={proBookable} onChange={(e) => setProBookable(e.target.checked)} />
                Reservable online
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={savePro} disabled={saving}>
              {saving ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog servicio */}
      <Dialog open={svcOpen} onOpenChange={(o) => !o && setSvcOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSvc ? "Editar servicio" : "Nuevo servicio"}</DialogTitle>
            <DialogDescription>Duración y precio del tratamiento reservable.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre *</Label>
              <Input value={svcName} onChange={(e) => setSvcName(e.target.value)} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Duración (min)</Label>
                <Input
                  type="number"
                  min={5}
                  step={5}
                  value={svcDuration}
                  onChange={(e) => setSvcDuration(Number(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Precio (€)</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={svcPrice}
                  onChange={(e) => setSvcPrice(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Color</Label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="color"
                  value={svcColor}
                  onChange={(e) => setSvcColor(e.target.value)}
                  className="h-10 w-14 rounded border border-input bg-transparent"
                />
                <Input value={svcColor} onChange={(e) => setSvcColor(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Descripción</Label>
              <textarea
                rows={2}
                value={svcDescription}
                onChange={(e) => setSvcDescription(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={svcActive} onChange={(e) => setSvcActive(e.target.checked)} />
              Activo
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSvcOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveSvc} disabled={saving}>
              {saving ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
