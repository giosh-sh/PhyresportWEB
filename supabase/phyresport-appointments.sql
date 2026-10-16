-- ============================================
-- PHYRESPORT - Sistema de citas y reservas
-- Ejecutar en el SQL Editor de Supabase.
-- ============================================

-- 1. PROFESIONALES
--    user_id = id de Clerk para enlazar la cuenta de login (admin/fisio).
CREATE TABLE IF NOT EXISTS professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  color TEXT NOT NULL DEFAULT '#00B8D4',
  specialty TEXT DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true,
  bookable BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. SERVICIOS RESERVABLES (con duración; por defecto 60 min)
CREATE TABLE IF NOT EXISTS booking_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  price_cents INTEGER NOT NULL DEFAULT 0,
  color TEXT DEFAULT '#00B8D4',
  description TEXT DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. DISPONIBILIDAD SEMANAL (recurrente) POR PROFESIONAL
--    weekday: 0 = domingo, 1 = lunes, ... 6 = sábado
CREATE TABLE IF NOT EXISTS availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  weekday SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. BLOQUEOS / AUSENCIAS
--    professional_id NULL = bloqueo de todo el centro.
CREATE TABLE IF NOT EXISTS time_off (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN NOT NULL DEFAULT false,
  reason TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. CITAS
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL,
  service_id UUID REFERENCES booking_services(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL DEFAULT '',
  patient_email TEXT DEFAULT '',
  patient_phone TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (status IN ('pendiente', 'confirmada', 'completada', 'cancelada', 'no_asistio')),
  source TEXT NOT NULL DEFAULT 'web' CHECK (source IN ('web', 'manual')),
  user_id TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_appointments_professional ON appointments(professional_id, start_at);
CREATE INDEX IF NOT EXISTS idx_appointments_start ON appointments(start_at);
CREATE INDEX IF NOT EXISTS idx_availability_professional ON availability(professional_id);
CREATE INDEX IF NOT EXISTS idx_time_off_professional ON time_off(professional_id);

-- Anti-overbooking: no puede haber dos citas activas del mismo profesional a la misma hora.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_appointments_active_slot
  ON appointments(professional_id, start_at)
  WHERE status <> 'cancelada';

-- 6. RPC: crear cita con validación atómica de solapamiento y bloqueos
CREATE OR REPLACE FUNCTION create_appointment(
  p_professional_id UUID,
  p_service_id UUID,
  p_start_at TIMESTAMPTZ,
  p_duration_minutes INTEGER,
  p_patient_name TEXT,
  p_patient_email TEXT DEFAULT '',
  p_patient_phone TEXT DEFAULT '',
  p_notes TEXT DEFAULT '',
  p_source TEXT DEFAULT 'web',
  p_user_id TEXT DEFAULT NULL,
  p_created_by TEXT DEFAULT NULL,
  p_status TEXT DEFAULT 'pendiente'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_end TIMESTAMPTZ;
  v_conflict INTEGER;
  v_id UUID;
BEGIN
  IF p_duration_minutes IS NULL OR p_duration_minutes <= 0 THEN
    RAISE EXCEPTION 'INVALID_DURATION';
  END IF;

  v_end := p_start_at + make_interval(mins => p_duration_minutes);

  -- Serializa las reservas del mismo profesional para evitar carreras.
  PERFORM pg_advisory_xact_lock(hashtext('appt:' || p_professional_id::text));

  SELECT COUNT(*) INTO v_conflict
  FROM appointments
  WHERE professional_id = p_professional_id
    AND status <> 'cancelada'
    AND start_at < v_end
    AND end_at > p_start_at;

  IF v_conflict > 0 THEN
    RAISE EXCEPTION 'SLOT_TAKEN';
  END IF;

  SELECT COUNT(*) INTO v_conflict
  FROM time_off
  WHERE (professional_id IS NULL OR professional_id = p_professional_id)
    AND start_at < v_end
    AND end_at > p_start_at;

  IF v_conflict > 0 THEN
    RAISE EXCEPTION 'SLOT_BLOCKED';
  END IF;

  INSERT INTO appointments (
    professional_id, service_id, patient_name, patient_email, patient_phone,
    notes, start_at, end_at, status, source, user_id, created_by
  ) VALUES (
    p_professional_id, p_service_id, p_patient_name, p_patient_email, p_patient_phone,
    p_notes, p_start_at, v_end, p_status, p_source, p_user_id, p_created_by
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- 7. RPC: reprogramar / reasignar una cita validando solapamiento
CREATE OR REPLACE FUNCTION reschedule_appointment(
  p_id UUID,
  p_professional_id UUID,
  p_start_at TIMESTAMPTZ,
  p_duration_minutes INTEGER
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_end TIMESTAMPTZ;
  v_conflict INTEGER;
BEGIN
  v_end := p_start_at + make_interval(mins => p_duration_minutes);

  PERFORM pg_advisory_xact_lock(hashtext('appt:' || p_professional_id::text));

  SELECT COUNT(*) INTO v_conflict
  FROM appointments
  WHERE professional_id = p_professional_id
    AND status <> 'cancelada'
    AND id <> p_id
    AND start_at < v_end
    AND end_at > p_start_at;

  IF v_conflict > 0 THEN
    RAISE EXCEPTION 'SLOT_TAKEN';
  END IF;

  SELECT COUNT(*) INTO v_conflict
  FROM time_off
  WHERE (professional_id IS NULL OR professional_id = p_professional_id)
    AND start_at < v_end
    AND end_at > p_start_at;

  IF v_conflict > 0 THEN
    RAISE EXCEPTION 'SLOT_BLOCKED';
  END IF;

  UPDATE appointments
  SET professional_id = p_professional_id,
      start_at = p_start_at,
      end_at = v_end,
      updated_at = now()
  WHERE id = p_id;
END;
$$;

-- 8. RLS (sin acceso anon; todo vía service role desde el servidor)
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Lectura pública de la oferta (para el wizard público /citas)
DROP POLICY IF EXISTS "anon_read_professionals" ON professionals;
CREATE POLICY "anon_read_professionals" ON professionals FOR SELECT TO anon USING (active = true);
DROP POLICY IF EXISTS "anon_read_booking_services" ON booking_services;
CREATE POLICY "anon_read_booking_services" ON booking_services FOR SELECT TO anon USING (active = true);

-- 9. SEED: profesionales (desde el equipo actual)
INSERT INTO professionals (name, slug, color, specialty, sort_order) VALUES
  ('Javier A. Gonzálvez', 'javier-adrian-gonzalvez-fernandez', '#00B8D4', 'Director — Fisioterapeuta', 0),
  ('Ruth Gutiérrez', 'ruth-gutierrez-gonzalez', '#22C55E', 'Fisioterapeuta', 1),
  ('Francisco J. Marichal', 'francisco-javier-marichal-garcia', '#6366F1', 'Fisioterapeuta', 2),
  ('Elisa Rodríguez', 'elisa-rodriguez-lapido', '#F59E0B', 'Fisioterapeuta', 3),
  ('María Pinto', 'maria-pinto-diaz', '#EC4899', 'Nutrición y readaptación', 4),
  ('Orestes Santiago', 'orestes-santiago-rodriguez-hernandez', '#8B5CF6', 'Fisioterapeuta', 5),
  ('Luis G. García Faria', 'luis-garcia-garcia-faria', '#14B8A6', 'Fisioterapeuta', 6)
ON CONFLICT (slug) DO NOTHING;

-- 10. SEED: servicios reservables (duración estándar 60 min, editable en admin)
INSERT INTO booking_services (name, slug, duration_minutes, price_cents, color, description, sort_order) VALUES
  ('Valoración inicial', 'valoracion-inicial', 60, 0, '#00B8D4', 'Primera visita y valoración personalizada.', 0),
  ('Fisioterapia · EPI Ecoguiada', 'fisioterapia-epi', 60, 0, '#0891B2', 'Tratamiento con electrólisis percutánea intratisular.', 1),
  ('Terapia Manual', 'terapia-manual', 60, 0, '#6366F1', 'Manipulación de la fascia y terapia manual avanzada.', 2),
  ('Descompresión Muscular', 'descompresion-muscular', 60, 0, '#8B5CF6', 'Tratamiento muscular con dispositivo de descompresión.', 3)
ON CONFLICT (slug) DO NOTHING;

-- 11. Disponibilidad por defecto (L-V 10:00–21:00) para cada profesional sin horario
INSERT INTO availability (professional_id, weekday, start_time, end_time)
SELECT p.id, d.weekday, TIME '10:00', TIME '21:00'
FROM professionals p
CROSS JOIN (VALUES (1), (2), (3), (4), (5)) AS d(weekday)
WHERE NOT EXISTS (
  SELECT 1 FROM availability a WHERE a.professional_id = p.id
);

-- 12. Categoría de navbar para /citas (gestionable y reordenable desde /admin/categories)
INSERT INTO categories (name, slug, parent_id, description, url, is_collection, sort_order)
VALUES ('Citas', 'citas', NULL, 'Reserva de citas online', '/citas', false, 5)
ON CONFLICT (slug) DO NOTHING;

-- 13. RECURRENCIA DE BLOQUEOS (estilo Google Calendar)
ALTER TABLE time_off ADD COLUMN IF NOT EXISTS recurrence TEXT NOT NULL DEFAULT 'none';
ALTER TABLE time_off ADD COLUMN IF NOT EXISTS recurrence_interval INTEGER NOT NULL DEFAULT 1;
ALTER TABLE time_off ADD COLUMN IF NOT EXISTS recurrence_weekdays INTEGER[] DEFAULT '{}';
ALTER TABLE time_off ADD COLUMN IF NOT EXISTS recurrence_until DATE;
