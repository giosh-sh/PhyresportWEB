-- ============================================
-- PHYRESPORT - Tabla slider_images (fotos del slider debajo del hero)
-- Ejecutar en SQL Editor tras el schema principal
-- ============================================
CREATE TABLE IF NOT EXISTS slider_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  link_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE slider_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_slider_images" ON slider_images;
CREATE POLICY "anon_read_slider_images" ON slider_images FOR SELECT TO anon USING (true);

CREATE INDEX IF NOT EXISTS idx_slider_images_order ON slider_images(sort_order);