-- ============================================
-- PHYRESPORT - Full Schema (tienda + panel admin)
-- Ejecutar una sola vez en Supabase SQL Editor
-- ============================================

-- CLEANUP
DROP TABLE IF EXISTS cart_items, user_favorites, orders, product_variants, products,
  categories, discounts, gift_cards, newsletter_subscribers, settings, banners,
  featured_products, email_campaigns, email_logs CASCADE;

-- 1. CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  description TEXT DEFAULT '',
  image TEXT DEFAULT '',
  is_collection BOOLEAN DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. PRODUCTS
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  materials TEXT NOT NULL DEFAULT '',
  price_cents INTEGER NOT NULL,
  compare_at_price_cents INTEGER,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  category_ids JSONB DEFAULT '[]'::jsonb,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  sizes TEXT[] NOT NULL DEFAULT '{}',
  colors JSONB NOT NULL DEFAULT '[]',
  in_stock BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  sku TEXT DEFAULT '',
  track_inventory BOOLEAN DEFAULT false,
  stock_quantity INTEGER DEFAULT 0,
  seo_title TEXT DEFAULT '',
  seo_description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. PRODUCT VARIANTS
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT NOT NULL DEFAULT '',
  size TEXT NOT NULL DEFAULT '',
  color_slug TEXT NOT NULL DEFAULT '',
  price_cents INTEGER,
  stock_quantity INTEGER DEFAULT 0,
  track_inventory BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  customer_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('draft','pending','paid','processing','shipped','delivered','cancelled','refunded')),
  total_cents INTEGER NOT NULL,
  payment_method TEXT,
  stripe_session_id TEXT,
  stripe_payment_intent TEXT,
  payment_verified_at TIMESTAMPTZ,
  items JSONB NOT NULL DEFAULT '[]',
  shipping_address JSONB,
  notes TEXT DEFAULT '',
  tracking_number TEXT DEFAULT '',
  shipping_carrier TEXT DEFAULT '',
  discount_code TEXT,
  discount_amount_cents INTEGER DEFAULT 0,
  gift_card_code TEXT,
  gift_card_amount_cents INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. DISCOUNTS
CREATE TABLE IF NOT EXISTS discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed_amount')),
  value INTEGER NOT NULL,
  min_purchase_cents INTEGER DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. GIFT CARDS
CREATE TABLE IF NOT EXISTS gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  initial_balance_cents INTEGER NOT NULL,
  remaining_balance_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'EUR',
  recipient_email TEXT DEFAULT '',
  sender_email TEXT DEFAULT '',
  message TEXT DEFAULT '',
  active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. NEWSLETTER SUBSCRIBERS
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  source TEXT DEFAULT '',
  subscribed_at TIMESTAMPTZ DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ
);

-- 8. SETTINGS (key-value store)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. BANNERS
CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT '',
  subtitle TEXT,
  description TEXT,
  image_url TEXT NOT NULL DEFAULT '',
  link_url TEXT,
  link_label TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT true,
  text_x INTEGER NOT NULL DEFAULT 50,
  text_y INTEGER NOT NULL DEFAULT 50,
  title_color TEXT,
  subtitle_color TEXT,
  video_url TEXT,
  video_start INTEGER,
  video_end INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. FEATURED PRODUCTS
CREATE TABLE IF NOT EXISTS featured_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. EMAIL CAMPAIGNS
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL DEFAULT '',
  html_content TEXT NOT NULL DEFAULT '',
  plain_text TEXT DEFAULT '',
  sender_name TEXT DEFAULT 'Phyresport',
  sender_email TEXT DEFAULT 'noreply@phyresport.com',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sending','sent','failed')),
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 12. EMAIL LOGS
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
  subscriber_id UUID REFERENCES newsletter_subscribers(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent','failed','bounced','opened','clicked')),
  error TEXT,
  sent_at TIMESTAMPTZ DEFAULT now()
);

-- 13. USER FAVORITES (wishlist)
CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- 14. CART ITEMS
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  price_cents INTEGER NOT NULL DEFAULT 0,
  image TEXT NOT NULL DEFAULT '',
  size TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '',
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 15. SLIDER IMAGES (fotos del slider debajo del hero)
CREATE TABLE IF NOT EXISTS slider_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  link_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_category_ids ON products USING GIN (category_ids);
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_discounts_code ON discounts(code);
CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON gift_cards(code);
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_items_user_product_variant ON cart_items(user_id, product_id, size, color);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_campaign ON email_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_slider_images_order ON slider_images(sort_order);

-- ROW LEVEL SECURITY
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
ALTER TABLE slider_images ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES: lectura pública para catálogo
DROP POLICY IF EXISTS "anon_read_categories" ON categories;
DROP POLICY IF EXISTS "anon_read_products" ON products;
DROP POLICY IF EXISTS "anon_read_product_variants" ON product_variants;
DROP POLICY IF EXISTS "anon_read_banners" ON banners;
DROP POLICY IF EXISTS "anon_read_featured_products" ON featured_products;
CREATE POLICY "anon_read_categories" ON categories FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_products" ON products FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_product_variants" ON product_variants FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_banners" ON banners FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_featured_products" ON featured_products FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "anon_read_slider_images" ON slider_images;
CREATE POLICY "anon_read_slider_images" ON slider_images FOR SELECT TO anon USING (true);

-- FUNCTIONS: decremento atómico de stock
CREATE OR REPLACE FUNCTION decrement_stock(
  p_product_id UUID,
  p_size TEXT,
  p_color TEXT,
  p_quantity INT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_track BOOLEAN;
  v_variant_id UUID;
  v_current INT;
BEGIN
  IF p_quantity <= 0 THEN
    RETURN;
  END IF;

  IF p_size IS NOT NULL OR p_color IS NOT NULL THEN
    SELECT id, stock_quantity, track_inventory
    INTO v_variant_id, v_current, v_track
    FROM product_variants
    WHERE product_id = p_product_id
      AND size = COALESCE(p_size, '')
      AND color_slug = COALESCE(p_color, '')
    FOR UPDATE;

    IF FOUND AND COALESCE(v_track, false) THEN
      UPDATE product_variants
      SET stock_quantity = GREATEST(0, stock_quantity - p_quantity)
      WHERE id = v_variant_id;

      UPDATE products
      SET stock_quantity = COALESCE((
        SELECT SUM(stock_quantity)
        FROM product_variants
        WHERE product_id = p_product_id
      ), 0),
      in_stock = COALESCE((
        SELECT SUM(stock_quantity)
        FROM product_variants
        WHERE product_id = p_product_id
      ), 0) > 0
      WHERE id = p_product_id;
    END IF;
  ELSE
    SELECT stock_quantity, track_inventory
    INTO v_current, v_track
    FROM products
    WHERE id = p_product_id
    FOR UPDATE;

    IF FOUND AND COALESCE(v_track, false) THEN
      UPDATE products
      SET stock_quantity = GREATEST(0, stock_quantity - p_quantity),
          in_stock = GREATEST(0, stock_quantity - p_quantity) > 0
      WHERE id = p_product_id;
    END IF;
  END IF;
END;
$$;

-- ============================================
-- SEED: settings por defecto
-- ============================================
INSERT INTO settings (key, value)
SELECT 'shipping', '{"shipping_rate": 8, "free_shipping_threshold": 150}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key = 'shipping');

INSERT INTO settings (key, value)
SELECT 'payments', '{"stripe_enabled": true, "bizum_enabled": false, "bizum_phone": ""}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key = 'payments');

INSERT INTO settings (key, value)
SELECT 'notifications',
       '{"order_confirmed": true, "order_shipped": true, "order_delivered": true, "low_stock_alert": true, "new_subscriber": false, "notification_email": ""}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key = 'notifications');

-- ============================================
-- SEED: categorías del navbar de Phyresport
-- + categoría phyresport/products para la tienda
-- ============================================
INSERT INTO categories (name, slug, parent_id, description, is_collection) VALUES
  ('Inicio', 'inicio', NULL, 'Página principal', false),
  ('Servicios', 'servicios', NULL, 'Fisioterapia deportiva, osteopatía y rehabilitación', false),
  ('Cursos', 'cursos', NULL, 'Formación especializada para fisioterapeutas', false),
  ('Productos', 'phyresport-products', NULL, 'Tienda de productos para fisioterapia y rehabilitación', true)
ON CONFLICT (slug) DO NOTHING;