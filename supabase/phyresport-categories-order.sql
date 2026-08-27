-- PHYRESPORT - Orden de categorias (navbar)
-- Ejecutar en el SQL Editor de Supabase si la tabla `categories` ya existe
-- (para bases creadas antes de que existiera la columna sort_order).
-- ============================================

ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Orden inicial de las categorias de nivel superior = orden de creacion (navbar)
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at, name) - 1 AS rn
  FROM categories
  WHERE parent_id IS NULL
)
UPDATE categories c
SET sort_order = o.rn
FROM ordered o
WHERE c.id = o.id;