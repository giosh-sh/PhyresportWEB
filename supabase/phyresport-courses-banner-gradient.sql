-- ============================================
-- PHYRESPORT - Cursos, inscripciones y degradado del banner
-- Ejecutar en el SQL Editor de Supabase.
-- ============================================

-- 1. BANNER: color y opacidad del degradado del hero
ALTER TABLE banners ADD COLUMN IF NOT EXISTS gradient_color TEXT DEFAULT '#0B1D3A';
ALTER TABLE banners ADD COLUMN IF NOT EXISTS gradient_opacity INTEGER DEFAULT 65;

-- 2. CURSOS
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  image_full_url TEXT NOT NULL DEFAULT '',
  program_pdf TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. INSCRIPCIONES A CURSOS
CREATE TABLE IF NOT EXISTS course_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  course_slug TEXT NOT NULL DEFAULT '',
  course_title TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  user_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'contacted', 'confirmed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_courses_order ON courses(sort_order);
CREATE INDEX IF NOT EXISTS idx_course_registrations_course ON course_registrations(course_id);
CREATE INDEX IF NOT EXISTS idx_course_registrations_created ON course_registrations(created_at DESC);

-- 4. RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_registrations ENABLE ROW LEVEL SECURITY;

-- Lectura pública del catálogo de cursos
DROP POLICY IF EXISTS "anon_read_courses" ON courses;
CREATE POLICY "anon_read_courses" ON courses FOR SELECT TO anon USING (true);

-- Las inscripciones solo se gestionan desde el servidor (service role).
-- No se crean policies para anon/authenticated => sin acceso directo.

-- 5. SEED: cursos actuales (solo si la tabla está vacía)
INSERT INTO courses (slug, title, date, description, image_url, image_full_url, program_pdf, sort_order)
VALUES
  (
    'epi-en-neuroeje',
    'EPI en Neuroeje',
    'Septiembre 2026',
    'Ecografía aplicada al neuroeje y técnicas de electrólisis percutánea para el tratamiento de patologías del sistema nervioso periférico.',
    'https://www.phyresport.com/images/Cursos/Curso_EcografiaNeuroeje_Septiembre2026_m.jpg',
    'https://www.phyresport.com/images/Cursos/Curso_EcografiaNeuroeje_Septiembre2026.jpg',
    'https://www.phyresport.com/images/Cursos/Curso_EcografiaNeuroeje_Septiembre2026_Programa.pdf',
    0
  ),
  (
    'epi-nivel-i-para-fisioterapeutas',
    'EPI Nivel I para Fisioterapeutas',
    'Octubre 2026',
    'Curso introductorio a la técnica EPI® Ecoguiada. Fundamentos teóricos y práctica clínica con supervisión directa.',
    'https://www.phyresport.com/images/Cursos/Curso_EPI_NIVEL_I_FisioTerapeutas_Octubre2026_m.jpg',
    'https://www.phyresport.com/images/Cursos/Curso_EPI_NIVEL_I_FisioTerapeutas_Octubre2026.jpg',
    'https://www.phyresport.com/images/Cursos/Curso_EPI_NIVEL_I_FisioTerapeutas_Octubre2026_Programa.pdf',
    1
  )
ON CONFLICT (slug) DO NOTHING;
