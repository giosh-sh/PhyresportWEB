-- ============================================
-- PHYRESPORT - Cubículos por profesional y por cita
-- Ejecutar en el SQL Editor de Supabase.
-- ============================================

-- 1. Cubículo del profesional (por defecto)
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS cubicle TEXT DEFAULT '';

-- 2. Cubículo de la cita
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cubicle TEXT DEFAULT '';

-- 3. Cubículos por defecto de cada fisio
UPDATE professionals SET cubicle = 'Atlas' WHERE name ILIKE '%elisa%'   AND (cubicle IS NULL OR cubicle = '');
UPDATE professionals SET cubicle = 'C4'    WHERE name ILIKE '%ruth%'    AND (cubicle IS NULL OR cubicle = '');
UPDATE professionals SET cubicle = 'C7'    WHERE name ILIKE '%marichal%' AND (cubicle IS NULL OR cubicle = '');
UPDATE professionals SET cubicle = 'C3'    WHERE name ILIKE '%luis%'    AND (cubicle IS NULL OR cubicle = '');
UPDATE professionals SET cubicle = 'C6'    WHERE name ILIKE '%rafael%'  AND (cubicle IS NULL OR cubicle = '');
UPDATE professionals SET cubicle = 'GYM'   WHERE name ILIKE '%pinto%'   AND (cubicle IS NULL OR cubicle = '');

-- 4. RPC create_appointment con cubículo (reemplaza la firma anterior)
DROP FUNCTION IF EXISTS create_appointment(uuid, uuid, timestamptz, integer, text, text, text, text, text, text, text, text);

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
  p_status TEXT DEFAULT 'pendiente',
  p_cubicle TEXT DEFAULT NULL
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

  PERFORM pg_advisory_xact_lock(hashtext('appt:' || p_professional_id::text));

  -- Cubículo: si no se indica, se toma el del profesional
  IF p_cubicle IS NULL OR p_cubicle = '' THEN
    SELECT cubicle INTO p_cubicle FROM professionals WHERE id = p_professional_id;
  END IF;

  -- Solape con el propio profesional
  SELECT COUNT(*) INTO v_conflict
  FROM appointments
  WHERE professional_id = p_professional_id
    AND status <> 'cancelada'
    AND start_at < v_end
    AND end_at > p_start_at;
  IF v_conflict > 0 THEN RAISE EXCEPTION 'SLOT_TAKEN'; END IF;

  -- Solape del mismo cubículo
  IF p_cubicle IS NOT NULL AND p_cubicle <> '' THEN
    SELECT COUNT(*) INTO v_conflict
    FROM appointments
    WHERE cubicle = p_cubicle
      AND status <> 'cancelada'
      AND start_at < v_end
      AND end_at > p_start_at;
    IF v_conflict > 0 THEN RAISE EXCEPTION 'CUBICLE_TAKEN'; END IF;
  END IF;

  -- Bloqueos
  SELECT COUNT(*) INTO v_conflict
  FROM time_off
  WHERE (professional_id IS NULL OR professional_id = p_professional_id)
    AND start_at < v_end
    AND end_at > p_start_at;
  IF v_conflict > 0 THEN RAISE EXCEPTION 'SLOT_BLOCKED'; END IF;

  INSERT INTO appointments (
    professional_id, service_id, patient_name, patient_email, patient_phone,
    notes, start_at, end_at, status, source, user_id, created_by, cubicle
  ) VALUES (
    p_professional_id, p_service_id, p_patient_name, p_patient_email, p_patient_phone,
    p_notes, p_start_at, v_end, p_status, p_source, p_user_id, p_created_by, COALESCE(p_cubicle, '')
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- 5. RPC reschedule_appointment con cubículo
DROP FUNCTION IF EXISTS reschedule_appointment(uuid, uuid, timestamptz, integer);

CREATE OR REPLACE FUNCTION reschedule_appointment(
  p_id UUID,
  p_professional_id UUID,
  p_start_at TIMESTAMPTZ,
  p_duration_minutes INTEGER,
  p_cubicle TEXT DEFAULT NULL
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

  -- Si no se indica cubículo, se mantiene el actual
  IF p_cubicle IS NULL THEN
    SELECT cubicle INTO p_cubicle FROM appointments WHERE id = p_id;
    IF p_cubicle IS NULL OR p_cubicle = '' THEN
      SELECT cubicle INTO p_cubicle FROM professionals WHERE id = p_professional_id;
    END IF;
  END IF;

  SELECT COUNT(*) INTO v_conflict
  FROM appointments
  WHERE professional_id = p_professional_id
    AND status <> 'cancelada'
    AND id <> p_id
    AND start_at < v_end
    AND end_at > p_start_at;
  IF v_conflict > 0 THEN RAISE EXCEPTION 'SLOT_TAKEN'; END IF;

  IF p_cubicle IS NOT NULL AND p_cubicle <> '' THEN
    SELECT COUNT(*) INTO v_conflict
    FROM appointments
    WHERE cubicle = p_cubicle
      AND status <> 'cancelada'
      AND id <> p_id
      AND start_at < v_end
      AND end_at > p_start_at;
    IF v_conflict > 0 THEN RAISE EXCEPTION 'CUBICLE_TAKEN'; END IF;
  END IF;

  SELECT COUNT(*) INTO v_conflict
  FROM time_off
  WHERE (professional_id IS NULL OR professional_id = p_professional_id)
    AND start_at < v_end
    AND end_at > p_start_at;
  IF v_conflict > 0 THEN RAISE EXCEPTION 'SLOT_BLOCKED'; END IF;

  UPDATE appointments
  SET professional_id = p_professional_id,
      start_at = p_start_at,
      end_at = v_end,
      cubicle = COALESCE(p_cubicle, cubicle),
      updated_at = now()
  WHERE id = p_id;
END;
$$;
