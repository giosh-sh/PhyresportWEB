-- PHYRESPORT - Storage bucket para imagenes (productos, banners, media)
-- Ejecutar en el SQL Editor de Supabase si las subidas fallan con "bucket not found".
-- Idempotente: se puede volver a ejecutar sin errores.
-- ============================================

-- 1. Crear el bucket publico (50 MB por archivo, sin restriccion de tipo)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product-images', 'product-images', true, 52428800, NULL)
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 52428800;

-- 2. Lectura publica de los objetos del bucket
DROP POLICY IF EXISTS "Public read product-images" ON storage.objects;
CREATE POLICY "Public read product-images" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'product-images');

-- 3. Subida/borrado desde el panel (con service role o sesion autenticada)
DROP POLICY IF EXISTS "Authenticated upload product-images" ON storage.objects;
CREATE POLICY "Authenticated upload product-images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Authenticated update product-images" ON storage.objects;
CREATE POLICY "Authenticated update product-images" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Authenticated delete product-images" ON storage.objects;
CREATE POLICY "Authenticated delete product-images" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'product-images');