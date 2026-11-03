-- ============================================
-- PHYRESPORT - Bloqueos y ausencias en la reserva
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de
-- phyresport-appointments.sql y phyresport-cubicles.sql.
--
-- Qué hace:
--   1. Se asegura de que existan las columnas de recurrencia de time_off.
--   2. Añade la función time_off_blocks(), que sabe si una cita cae dentro
--      de un bloqueo puntual o de una serie recurrente (diaria/semanal/mensual).
--   3. Recrea create_appointment() y reschedule_appointment() para usarla.
--   4. Deja esas funciones solo para el servidor (service_role), de modo que
--      nadie pueda saltarse las validaciones desde el navegador.
-- ============================================

-- 1. Columnas de recurrencia (idempotente)
ALTER TABLE time_off ADD COLUMN IF NOT EXISTS recurrence TEXT NOT NULL DEFAULT 'none';
ALTER TABLE time_off ADD COLUMN IF NOT EXISTS recurrence_interval INTEGER NOT NULL DEFAULT 1;
ALTER TABLE time_off ADD COLUMN IF NOT EXISTS recurrence_weekdays INTEGER[] DEFAULT '{}';
ALTER TABLE time_off ADD COLUMN IF NOT EXISTS recurrence_until DATE;

-- 2. ¿Hay algún bloqueo/ausencia que cubra [p_start, p_end)?
--    Los bloqueos con professional_id NULL afectan a todo el centro.
--    La zona horaria del centro es Atlantic/Canary (Santa Cruz de Tenerife).
CREATE OR REPLACE FUNCTION time_off_blocks(
  p_professional_id UUID,
  p_start TIMESTAMPTZ,
  p_end TIMESTAMPTZ
) RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  s RECORD;
  v_recurrence TEXT;
  v_base_date DATE;
  v_start_time TIME;
  v_end_time TIME;
  v_day_offset INTEGER;
  v_interval INTEGER;
  v_weekdays INTEGER[];
  v_candidate DATE;
  v_limit DATE;
  v_diff INTEGER;
  v_occ_start TIMESTAMPTZ;
  v_occ_end TIMESTAMPTZ;
BEGIN
  IF p_start IS NULL OR p_end IS NULL OR p_end <= p_start THEN
    RETURN FALSE;
  END IF;

  FOR s IN
    SELECT * FROM time_off
    WHERE professional_id IS NULL OR professional_id = p_professional_id
  LOOP
    v_recurrence := COALESCE(s.recurrence, 'none');

    -- Bloqueo puntual: comprobación directa de solape.
    IF v_recurrence = 'none' THEN
      IF s.start_at < p_end AND s.end_at > p_start THEN
        RETURN TRUE;
      END IF;
      CONTINUE;
    END IF;

    v_base_date  := (s.start_at AT TIME ZONE 'Atlantic/Canary')::date;
    v_start_time := (s.start_at AT TIME ZONE 'Atlantic/Canary')::time;
    v_end_time   := (s.end_at AT TIME ZONE 'Atlantic/Canary')::time;
    v_day_offset := ((s.end_at AT TIME ZONE 'Atlantic/Canary')::date - v_base_date);
    v_interval   := GREATEST(COALESCE(s.recurrence_interval, 1), 1);
    v_weekdays   := COALESCE(s.recurrence_weekdays, '{}');

    -- Solo hace falta mirar las ocurrencias que podrían solapar con esta cita
    -- (la cita dura minutos/horas, así que el rango de fechas es diminuto).
    v_limit := (p_end AT TIME ZONE 'Atlantic/Canary')::date + 1;
    IF s.recurrence_until IS NOT NULL AND s.recurrence_until < v_limit THEN
      v_limit := s.recurrence_until;
    END IF;

    v_candidate :=
      (p_start AT TIME ZONE 'Atlantic/Canary')::date
      - GREATEST(v_day_offset, 0)
      - 1;
    IF v_candidate < v_base_date THEN
      v_candidate := v_base_date;
    END IF;

    WHILE v_candidate <= v_limit LOOP
      v_diff := v_candidate - v_base_date;

      IF (
        -- Diaria: cada N días desde la fecha base.
        (v_recurrence = 'daily' AND (v_diff % v_interval) = 0)
        OR
        -- Semanal: días elegidos, alineados por semanas desde la fecha base.
        (
          v_recurrence = 'weekly'
          AND (
            CASE
              WHEN cardinality(v_weekdays) > 0
                THEN EXTRACT(DOW FROM v_candidate)::int = ANY(v_weekdays)
              ELSE EXTRACT(DOW FROM v_candidate)::int = EXTRACT(DOW FROM v_base_date)::int
            END
          )
          AND ((v_diff / 7) % v_interval) = 0
        )
        OR
        -- Mensual: mismo día (con ajuste de meses cortos) cada N meses.
        (
          v_recurrence = 'monthly'
          AND (
            (EXTRACT(YEAR FROM v_candidate)::int * 12 + EXTRACT(MONTH FROM v_candidate)::int)
            - (EXTRACT(YEAR FROM v_base_date)::int * 12 + EXTRACT(MONTH FROM v_base_date)::int)
          ) % v_interval = 0
          AND (
            v_base_date + make_interval(months => (
              (EXTRACT(YEAR FROM v_candidate)::int * 12 + EXTRACT(MONTH FROM v_candidate)::int)
              - (EXTRACT(YEAR FROM v_base_date)::int * 12 + EXTRACT(MONTH FROM v_base_date)::int)
            ))
          )::date = v_candidate
        )
      ) THEN
        v_occ_start := (v_candidate + v_start_time) AT TIME ZONE 'Atlantic/Canary';
        v_occ_end := ((v_candidate + v_day_offset) + v_end_time) AT TIME ZONE 'Atlantic/Canary';
        IF v_occ_end <= v_occ_start THEN
          v_occ_end := v_occ_start + interval '1 day';
        END IF;

        IF v_occ_start < p_end AND v_occ_end > p_start THEN
          RETURN TRUE;
        END IF;
      END IF;

      v_candidate := v_candidate + 1;
    END LOOP;
  END LOOP;

  RETURN FALSE;
END;
$$;

-- 3. create_appointment() con cubículo + bloqueos recurrentes
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
SET search_path = public, pg_temp
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

  -- Cubículo: si no se indica, se toma el del profesional.
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

  -- Bloqueos y ausencias (puntuales o recurrentes, del centro o del fisio)
  IF time_off_blocks(p_professional_id, p_start_at, v_end) THEN
    RAISE EXCEPTION 'SLOT_BLOCKED';
  END IF;

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

-- 4. reschedule_appointment() con cubículo + bloqueos recurrentes
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
SET search_path = public, pg_temp
AS $$
DECLARE
  v_end TIMESTAMPTZ;
  v_conflict INTEGER;
BEGIN
  v_end := p_start_at + make_interval(mins => p_duration_minutes);

  PERFORM pg_advisory_xact_lock(hashtext('appt:' || p_professional_id::text));

  -- Si no se indica cubículo, se mantiene el actual.
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

  -- Bloqueos y ausencias (puntuales o recurrentes, del centro o del fisio)
  IF time_off_blocks(p_professional_id, p_start_at, v_end) THEN
    RAISE EXCEPTION 'SLOT_BLOCKED';
  END IF;

  UPDATE appointments
  SET professional_id = p_professional_id,
      start_at = p_start_at,
      end_at = v_end,
      cubicle = COALESCE(p_cubicle, cubicle),
      updated_at = now()
  WHERE id = p_id;
END;
$$;

-- 5. Solo el servidor (service_role) puede crear/mover citas.
--    Las reservas públicas pasan siempre por una server action que valida
--    horario, días de cierre y bloqueos antes de llamar a estas funciones.
REVOKE ALL ON FUNCTION time_off_blocks(uuid, timestamptz, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION create_appointment(uuid, uuid, timestamptz, integer, text, text, text, text, text, text, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION reschedule_appointment(uuid, uuid, timestamptz, integer, text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION time_off_blocks(uuid, timestamptz, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION create_appointment(uuid, uuid, timestamptz, integer, text, text, text, text, text, text, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION reschedule_appointment(uuid, uuid, timestamptz, integer, text) TO service_role;
