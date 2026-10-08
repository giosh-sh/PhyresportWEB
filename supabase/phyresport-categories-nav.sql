-- ============================================
-- PHYRESPORT - Navegación de categorías (navbar guiado desde /admin/categories)
-- Ejecutar en SQL Editor sobre bases ya creadas.
--
-- Contrato del navbar:
--   - `url` con valor  -> enlace directo a una página o URL externa.
--   - `url` vacío + is_collection = true -> grupo de productos (/categoria/<slug>).
--
-- Este script asigna los destinos de las categorías del seed inicial que
-- quedaron sin `url`, para que el navbar siga funcionando. No sobreescribe
-- categorías ya configuradas manualmente.
-- ============================================

-- 1. Asegura que las columnas existan (idempotente)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS url TEXT NOT NULL DEFAULT '';
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_collection BOOLEAN DEFAULT false;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- 2. Categoría de contacto (si no existía en el seed)
INSERT INTO categories (name, slug, parent_id, description, url, is_collection, sort_order)
SELECT 'Contacto', 'contacto', NULL, 'Página de contacto', '/contacto', false, 4
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'contacto');

-- 3. Destinos de páginas de marketing (solo si aún no tienen url)
UPDATE categories SET url = '/'            WHERE slug = 'inicio'             AND COALESCE(url, '') = '';
UPDATE categories SET url = '/servicios'   WHERE slug = 'servicios'          AND COALESCE(url, '') = '';
UPDATE categories SET url = '/cursos'      WHERE slug = 'cursos'             AND COALESCE(url, '') = '';
UPDATE categories SET url = '/contacto'    WHERE slug = 'contacto'           AND COALESCE(url, '') = '';

-- 4. Grupo de productos de la tienda (colección)
UPDATE categories
SET url = '/tienda', is_collection = true
WHERE slug IN ('phyresport-products', 'productos', 'tienda', 'shop')
  AND COALESCE(url, '') = '';

-- 5. Orden inicial del navbar por creación (si no hay orden definido)
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at, name) - 1 AS rn
  FROM categories
  WHERE parent_id IS NULL
)
UPDATE categories c
SET sort_order = o.rn
FROM ordered o
WHERE c.id = o.id AND COALESCE(c.sort_order, 0) = 0;
