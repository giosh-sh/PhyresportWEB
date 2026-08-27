-- ============================================
-- PHYRESPORT - Añadir sort_order a categories
-- Ejecutar en SQL Editor tras el schema principal
-- ============================================
ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;