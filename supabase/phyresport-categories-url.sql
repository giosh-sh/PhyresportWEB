-- PHYRESPORT - Añadir campo url a categories
-- Ejecutar en el SQL Editor de Supabase.
--
-- `url` define a dónde lleva la categoría en el menú:
--   - Vacío  => categoría de productos: enlaza a /categoria/<slug> (listado de productos).
--   - Con valor => enlace directo (ej. /servicios/fisioterapia, /cursos, https://...).

ALTER TABLE categories ADD COLUMN IF NOT EXISTS url TEXT NOT NULL DEFAULT '';
