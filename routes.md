# routes.md — Mapa de rutas y arquitectura de PhyresportWEB

> Documento de contexto para agentes. Describe qué es la web, cómo está
> organizada y todas las rutas (páginas, API y server actions) para poder
> trabajar sin releer todo el código. Actualízalo si añades/renombras rutas.

---

## 1. Qué es esta web

Web corporativa + tienda online de **Phyresport & Nutrición**, un centro de
fisioterapia deportiva, osteopatía y rehabilitación en Santa Cruz de Tenerife
(especialistas en EPI Ecoguiada). Idioma: **español**. Marca/tono: deportivo,
premium, azul marino (`navy`) + turquesa (`teal`).

Tiene dos grandes áreas:

1. **Sitio público/marketing** (`/`, `/servicios`, `/equipo`, `/cursos`,
   `/productos`, `/contacto`): contenido estático definido en
   `src/lib/data.ts` (los datos NO vienen de Supabase en estas páginas).
2. **Tienda online** (`/tienda`, `/product/[slug]`, `/cart`, `/checkout`,
   `/orders`, `/wishlist`, `/categoria/[slug]`): catálogo en Supabase, carrito
   persistido, pago con Stripe o Bizum, emails con Resend.
3. **Panel de administración** (`/admin/**`): gestión completa de productos,
   pedidos, inventario, descuentos, tarjetas regalo, newsletter, banners,
   slider, medios y ajustes. Protegido con Clerk + rol admin.

---

## 2. Stack y convenciones

| Área | Tecnología |
|---|---|
| Framework | **Next.js 16.3.3** (App Router) + **React 19** |
| Lenguaje | TypeScript (`@/*` → `./src/*`) |
| Estilos | Tailwind CSS v4 (`@theme inline` en `src/app/globals.css`) |
| UI | Radix UI + componentes propios en `src/components/ui` |
| Auth | **Clerk** (`@clerk/nextjs`) |
| BD | **Supabase** (Postgres + Storage), cliente admin con service role |
| Pagos | **Stripe** (Checkout) + Bizum (manual) |
| Emails | **Resend** |
| Estado cliente | **Zustand** (`src/store`) |
| Iconos/animación | lucide-react, framer-motion |
| Otros | react-hook-form + zod, recharts, @tanstack/react-table, sonner |

**Importante (Next 16):** el middleware tradicional ahora es
`src/proxy.ts` (exporta `clerkMiddleware()`). No existe `middleware.ts`.
Antes de tocar APIs/config, leer `node_modules/next/dist/docs/` según indica
`AGENTS.md`.

**Alias:** `@/` apunta a `src/`. Colores de marca en `globals.css`:
`navy`, `teal`, `cyan`, `ice`, `charcoal`, `whatsapp` y tokens `admin-*`.

---

## 3. Estructura de carpetas

```
src/
  app/
    page.tsx                     Home (secciones de marketing)
    layout.tsx                   Layout raíz: ClerkProvider + fuentes + cart/favorites
    proxy.ts                     Middleware Clerk (Next 16)
    globals.css                  Tailwind v4 + tema
    (tienda)/                    Route group de tienda (layout con header sólido)
    admin/                       Panel admin (layout protegido)
    api/                         Route handlers (ver §6)
    servicios/ equipo/ cursos/ productos/ contacto/ sign-in/ sign-up/
  components/
    layout/  (header, footer, header-wrapper)
    sections/ (hero, about, gym, technology, services, team, courses, cta)
    ui/      (button, input, dialog, sheet, table, tabs, etc.)
    admin/   (AdminSidebar, DashboardCharts, MediaPicker, DataTable*, etc.)
    CartDrawer, ProductCatalog, ShopCatalog, ProductDetailClient, ProductCard...
  lib/
    data.ts                      Contenido estático (siteConfig, services, team, courses, products, objectives)
    stripe.ts, resend.ts, stock.ts, cart-actions.ts, utils.ts, storage-client.ts
    admin-auth.ts                isAdmin() / requireAdmin()
    admin/                       Server actions del panel admin (ver §7)
    supabase/                    client.ts, server.ts, admin.ts, public.ts, storage.ts
  services/  (supabase-store.ts, orders.ts, favorites.ts)  Consultas de datos cliente/servidor
  store/     (cart.ts, favorites-store.ts)                Zustand
  hooks/     (useShipping.ts, useKeyboardShortcuts.ts)
  emails/                                                  Plantillas de email
  types/     (product.ts)                                  Tipos Product/Category/Order/CartItem
supabase/                     Scripts SQL (schema, tienda, RLS, storage, migraciones)
public/img/                   Imágenes locales usadas por data.ts
```

---

## 4. Rutas públicas (marketing)

Datos desde `src/lib/data.ts`. Todas usan `HeaderWrapper` + `Footer` +
`WhatsAppFloat`.

| Ruta | Archivo | Descripción |
|---|---|---|
| `/` | `src/app/page.tsx` | Home con secciones: Hero, About, Gym, Technology, Services, Team, Courses, CTA |
| `/servicios` | `src/app/servicios/page.tsx` | Listado de servicios |
| `/servicios/[slug]` | `src/app/servicios/[slug]/page.tsx` | Detalle servicio (`services` en data.ts) |
| `/equipo/[slug]` | `src/app/equipo/[slug]/page.tsx` | Ficha de miembro del equipo |
| `/cursos` | `src/app/cursos/page.tsx` | Listado de cursos de formación |
| `/cursos/[slug]` | `src/app/cursos/[slug]/page.tsx` | Detalle de curso |
| `/productos` | `src/app/productos/page.tsx` | Catálogo de dispositivos/equipos (marketing) |
| `/productos/[slug]` | `src/app/productos/[slug]/page.tsx` | Detalle del dispositivo |
| `/contacto` | `src/app/contacto/page.tsx` | Formulario de contacto + datos |
| `/sign-in/[[...sign-in]]` | `src/app/sign-in/.../page.tsx` | Clerk `<SignIn>` |
| `/sign-up/[[...sign-up]]` | `src/app/sign-up/.../page.tsx` | Clerk `<SignUp>` |

> Ojo: `/productos/[slug]` (marketing, estático) y `/product/[slug]` (tienda,
> Supabase) son rutas distintas. No confundirlas.

---

## 5. Rutas de la tienda — route group `(tienda)`

Layout `src/app/(tienda)/layout.tsx`: header sólido, footer, WhatsApp. El grupo
no añade prefijo de URL.

| Ruta | Archivo | Descripción |
|---|---|---|
| `/tienda` | `(tienda)/tienda/page.tsx` | Catálogo de tienda (`ShopPageShell` de `ShopCatalog`) |
| `/shop` | `(tienda)/shop/page.tsx` | **Redirige** a `/tienda` |
| `/categoria/[slug]` | `(tienda)/categoria/[slug]/page.tsx` | Productos por categoría (`ProductCatalog`) |
| `/product/[slug]` | `(tienda)/product/[slug]/page.tsx` | Detalle de producto (`ProductDetailClient`) |
| `/cart` | `(tienda)/cart/page.tsx` | Carrito (Zustand) |
| `/checkout` | `(tienda)/checkout/page.tsx` | Checkout, direcciones, descuento, envío, pago |
| `/orders` | `(tienda)/orders/page.tsx` | Pedidos del usuario + confirmación Stripe (`session_id`) |
| `/wishlist` | `(tienda)/wishlist/page.tsx` | Favoritos del usuario |

Detalles de flujo:
- El carrito vive en `src/store/cart.ts` (Zustand, persistido). También existe
  `src/lib/cart-actions.ts` para persistir el carrito en `cart_items` de Supabase.
- `useShipping()` (`src/hooks/useShipping.ts`) lee `/api/public/shipping` para
  calcular el coste de envío.
- El checkout hace POST a `/api/checkout` y redirige a la URL de Stripe.
- `/orders?session_id=...` verifica el pago vía `/api/verify-payment`.

---

## 6. Rutas API (`src/app/api`)

| Ruta | Método | Auth | Descripción |
|---|---|---|---|
| `/api/products` | GET | pública | Lista productos activos + categoría + variantes. `revalidate=60` |
| `/api/products/[slug]` | GET | pública | Producto activo por slug. `revalidate=60` |
| `/api/categories` | GET | pública | Lista categorías. `revalidate=60` |
| `/api/public/shipping` | GET | pública | Config de envío desde `settings.shipping`. `revalidate=60` |
| `/api/public/payments` | GET | pública | Métodos de pago activos desde `settings.payments`. `revalidate=60` |
| `/api/discount/validate` | POST | pública | Valida un código de descuento y devuelve `discountAmountCents` |
| `/api/contact` | POST | pública | Envía email de contacto con Resend a `info@phyresport.com` |
| `/api/checkout` | POST | opcional (Clerk) | Crea pedido y sesión Stripe (o pedido Bizum). Ver lógica abajo |
| `/api/verify-payment` | GET | pública | Verifica `session_id` de Stripe, marca pedido `paid`, envía email |
| `/api/webhooks/stripe` | POST | firma Stripe | Webhook: `checkout.session.completed`/async/expired → stock, estado, emails |

Lógica clave de `/api/checkout` (`route.ts`):
1. Valida items con zod, lee productos/variantes de Supabase (admin client).
2. Comprueba stock y existencia de variante talla/color.
3. Lee `settings.shipping` (envío gratis ≥ umbral).
4. Aplica `discounts` y `gift_cards`; calcula total final.
5. Si `paymentMethod === "bizum"` → crea pedido `pending` y responde `{orderId}`.
6. Si Stripe → crea `coupon` si hay descuento, crea `checkout.sessions` con
   `success_url=/orders?session_id=...`, inserta pedido y devuelve `{url}`.

Lógica clave del webhook (`webhooks/stripe/route.ts`):
- `checkout.session.completed` + `payment_status=paid` → `processPaidOrder`.
- `processPaidOrder`: `decrementStockWithFallback`, marca `paid` +
  `payment_verified_at`, guarda email/`payment_intent`/dirección, incrementa
  `used_count` de descuento, descuenta saldo de tarjeta regalo y envía email.
- `async_payment_succeeded` / `async_payment_failed` / `expired` también gestionados.

---

## 7. Server actions del panel admin (`src/lib/admin/*`)

Todas llevan `'use server'`. Cada página de `/admin` importa las suyas.

| Archivo | Funciones principales |
|---|---|
| `admin-auth.ts` (en `lib/`) | `isAdmin(userId)`, `requireAdmin()` (rol Clerk `publicMetadata.role === "admin"` o env `ADMIN_USER_ID(S)`) |
| `orders.ts` | `getOrders`, `getOrder`, `createOrder`, `updateOrderStatus`, `bulkUpdateOrdersStatus`, `bulkDeleteOrders`, `updateOrderNotes`, `updateOrderShipping`, `getStripeSessionUrl`, `verifyStripePayment`, y métricas de dashboard (`getDashboardMetrics`, `getRevenueChart`, `getTopSellingProducts`, `getLowStockProducts`, `getRecentCustomers`, `getQuickDashboard`) |
| `products.ts` | `getProducts`, `getProduct`, `createProduct`, `updateProduct`, `deleteProduct`, `bulkDeleteProducts`, `bulkUpdateProducts`, `duplicateProduct`, `quickUpdateProduct` |
| `categories.ts` | `getCategories`, `reorderCategories`, `createCategory`, `updateCategory`, `deleteCategory`, `uploadCategoryImage` |
| `inventory.ts` | `getInventory`, `updateProductStock`, `updateVariantStock` |
| `discounts.ts` | `getDiscounts`, `createDiscount`, `updateDiscount`, `deleteDiscount`, `bulkDeleteDiscounts`, `bulkUpdateDiscounts` |
| `gift-cards.ts` | `getGiftCards`, `createGiftCard`, `updateGiftCard`, `deleteGiftCard`, `bulkDeleteGiftCards` |
| `newsletter.ts` | `getSubscribers`, `createSubscriber`, `deleteSubscriber`, `bulkDeleteSubscribers`, `updateSubscriberStatus` |
| `banners.ts` | `getBanners`, `createBanner`, `updateBanner`, `deleteBanner`, `reorderBanners`, `toggleBannerActive` |
| `slider.ts` | `getSliderImages`, `createSliderImage`, `updateSliderImage`, `deleteSliderImage`, `reorderSliderImages`, `toggleSliderImageActive` |
| `media.ts` | `getMediaList`, `uploadMedia`, `deleteMedia`, `uploadMediaFile` |
| `featured-products.ts` | `getFeaturedProductIds`, `toggleFeaturedByProductId` |
| `settings.ts` | `getAllSettings`, `getSetting`, `updateSetting`, `saveSetting`, `uploadSettingImage` |
| `notifications.ts` | `getNotificationSettings`, `sendOrderStatusNotification`, `buildOrderStatusEmail`, etc. |
| `currency.ts` / `theme.ts` | `getCurrencyConfig`, `getAdminTheme` (config visual del panel) |
| `email-preview.ts` | `renderEmailTemplatePreview` |

---

## 8. Rutas del panel admin (`/admin/**`)

`src/app/admin/layout.tsx` es **server component protegido**: exige sesión Clerk
(`redirectToSignIn`) y `isAdmin`, si no `redirect('/')`. Carga moneda y tema y
envuelve con `AdminLayoutClient`.

| Ruta | Archivo | Función |
|---|---|---|
| `/admin` | `admin/page.tsx` | Dashboard con métricas y gráficas |
| `/admin/products` | `admin/products/page.tsx` | CRUD productos (crear/editar/duplicar/borrar, variantes, SEO, destacados) |
| `/admin/categories` | `admin/categories/page.tsx` | CRUD + reorden de categorías |
| `/admin/inventory` | `admin/inventory/page.tsx` | Stock por producto/variante |
| `/admin/orders` | `admin/orders/page.tsx` | Pedidos, estados, seguimiento, verificación Stripe |
| `/admin/customers` | `admin/customers/page.tsx` | Clientes y sus pedidos |
| `/admin/discounts` | `admin/discounts/page.tsx` | Cupones (%, importe, usos, caducidad) |
| `/admin/gift-cards` | `admin/gift-cards/page.tsx` | Tarjetas regalo y saldos |
| `/admin/newsletter` | `admin/newsletter/page.tsx` | Suscriptores y campañas |
| `/admin/banners` | `admin/banners/page.tsx` | Banners del hero (texto, imagen, vídeo) |
| `/admin/slider` | `admin/slider/page.tsx` | Imágenes del slider |
| `/admin/media` | `admin/media/page.tsx` | Biblioteca de medios (Supabase Storage) |
| `/admin/settings` | `admin/settings/page.tsx` | Ajustes (envío, pagos, notificaciones, tema) |

No hay ruta `/admin/login`: el acceso es mediante Clerk; el enlace "Admin" del
header solo aparece si `user.publicMetadata.role === "admin"`.

---

## 9. Base de datos (Supabase)

Scripts en `supabase/` (ejecutar en el SQL Editor; `phyresport-schema.sql` es el
completo y hace cleanup + seed):

`categories`, `products`, `product_variants`, `orders`, `discounts`,
`gift_cards`, `newsletter_subscribers`, `settings` (key-value JSONB),
`banners`, `featured_products`, `email_campaigns`, `email_logs`,
`user_favorites`, `cart_items`, `slider_images`.

- RLS activado. Lectura pública (`anon`) para catálogo: `categories`,
  `products`, `product_variants`, `banners`, `featured_products`,
  `slider_images`. El resto se accede con **service role** desde el admin
  (`createAdminClient`), que salta RLS.
- Función `decrement_stock(p_product_id, p_size, p_color, p_quantity)` para
  stock atómico. `src/lib/stock.ts` usa `decrementStockWithFallback`.
- Settings sembrados: `shipping` (`shipping_rate: 8`,
  `free_shipping_threshold: 150`), `payments`, `notifications`.
- Storage: bucket público **`product-images`** (`phyresport-storage.sql`).
- Migraciones auxiliares: `phyresport-categories-order.sql`,
  `phyresport-categories-sort.sql`, `phyresport-categories-url.sql`,
  `phyresport-rls.sql`, `phyresport-slider-images.sql`.

Clientes Supabase (`src/lib/supabase/`):
- `client.ts` → navegador; `server.ts` → server con cookies;
  `admin.ts` → service role (`createAdminClient`), el que más se usa;
  `public.ts` → anon; `storage.ts` → helpers de Storage.

---

## 10. Variables de entorno

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY        # cliente admin (server-only)
NEXT_PUBLIC_APP_URL
CLERK_SECRET_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
RESEND_FROM                      # opcional, remitente por defecto
ADMIN_USER_ID / ADMIN_USER_IDS   # opcional, IDs de Clerk admin (comma-separated)
```

Auth admin por dos vías: env `ADMIN_USER_ID(S)` o `publicMetadata.role = "admin"`
en Clerk (`src/lib/admin-auth.ts`).

---

## 11. Notas para el siguiente agente

- **Contenido vs BD**: marketing (`/servicios`, `/equipo`, `/cursos`,
  `/productos`) se edita en `src/lib/data.ts`; la tienda (`/tienda`,
  `/product/[slug]`) lee de Supabase.
- El header construye la navegación desde las categorías de Supabase
  (`/admin/categories`), ordenadas por `sort_order`, más los `STATIC_LINKS`
  globales (deduplicados por href). El destino se resuelve en `categoryHref()`
  de `src/components/layout/header.tsx` con este contrato:
  1. `url` con valor → enlace directo (página interna, `https://`, `mailto:`…).
  2. `is_collection = true` → grupo de productos → `/categoria/<slug>`.
  3. slug heredado (`LEGACY_PAGE_URLS`) → página de marketing del seed antiguo.
  4. por defecto → grupo de productos (`/categoria/<slug>`).
  Gestionar desde el panel admin: rellenar `url` para páginas, o dejar vacío +
  marcar "colección" para grupos de productos.
- Componentes de servidor leen datos con `src/services/supabase-store.ts`
  (funciones memoizadas con `cache()`); `src/services/orders.ts` y
  `favorites.ts` son para el usuario autenticado.
- El layout raíz monta `<CartDrawer />` y `<FavoritesHydrator />` globalmente.
- Marca la tienda como route group `(tienda)`: no cambies los nombres de carpeta
  por el prefijo de URL (el grupo no lo aporta).
- `README.md` es el boilerplate de create-next-app (no fiable). Usa este
  `routes.md` y `AGENTS.md`.
- Precios en **céntimos** (`price_cents`, `total_cents`) en todo el código.
- Formato y lint: `npm run lint`. Dev: `npm run dev`.
