-- ═══════════════════════════════════════════════════════════════
-- PHYRESPORT — RLS completo (equivalente a Sportbalin 011)
-- Corrige "new row violates row-level security policy" y deja
-- las policies en el mismo estado que el proyecto Sportbalin.
-- Ejecutar en el SQL Editor de Supabase.
-- ═══════════════════════════════════════════════════════════════

-- 1. ELIMINAR TODAS LAS POLICIES EXISTENTES
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END
$$;

-- 2. HABILITAR RLS EN TODAS LAS TABLAS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- 3. LECTURA PUBLICA DEL CATALOGO
CREATE POLICY "public_read_categories" ON categories
  FOR SELECT USING (true);
CREATE POLICY "public_read_products" ON products
  FOR SELECT USING (true);
CREATE POLICY "public_read_product_variants" ON product_variants
  FOR SELECT USING (true);
CREATE POLICY "public_read_featured_products" ON featured_products
  FOR SELECT USING (true);
CREATE POLICY "public_read_banners" ON banners
  FOR SELECT USING (true);

-- 4. CARRITO Y FAVORITOS: cada usuario gestiona los suyos
--    Nota: user_id es TEXT, por eso auth.uid() se convierte a texto.
CREATE POLICY "user_read_own_cart" ON cart_items
  FOR SELECT TO authenticated
  USING ((select auth.uid())::text = user_id);
CREATE POLICY "user_insert_own_cart" ON cart_items
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid())::text = user_id);
CREATE POLICY "user_update_own_cart" ON cart_items
  FOR UPDATE TO authenticated
  USING ((select auth.uid())::text = user_id)
  WITH CHECK ((select auth.uid())::text = user_id);
CREATE POLICY "user_delete_own_cart" ON cart_items
  FOR DELETE TO authenticated
  USING ((select auth.uid())::text = user_id);

CREATE POLICY "user_read_own_favorites" ON user_favorites
  FOR SELECT TO authenticated
  USING ((select auth.uid())::text = user_id);
CREATE POLICY "user_insert_own_favorites" ON user_favorites
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid())::text = user_id);
CREATE POLICY "user_delete_own_favorites" ON user_favorites
  FOR DELETE TO authenticated
  USING ((select auth.uid())::text = user_id);

-- 5. NEWSLETTER: suscripcion publica
CREATE POLICY "public_insert_newsletter" ON newsletter_subscribers
  FOR INSERT WITH CHECK (true);

-- 6. TABLAS DE ADMIN (orders, discounts, gift_cards, settings,
--    email_campaigns, email_logs, categories, products, banners...)
--    Sin policies publicas: SOLO accesibles via service role
--    (SUPABASE_SERVICE_ROLE_KEY bypassa RLS automaticamente).
--    No crear policies de escritura aqui: dejaria editar a cualquier
--    usuario autenticado.