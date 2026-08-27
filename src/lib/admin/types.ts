export type OrderStatus = "draft" | "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";

export type ProductStatus = "active" | "draft" | "archived";

export const PRODUCT_STATUS_OPTIONS: { value: ProductStatus; label: string }[] = [
  { value: "active", label: "Activo" },
  { value: "draft", label: "Borrador" },
  { value: "archived", label: "Archivado" },
];

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  active: "Activo",
  draft: "Borrador",
  archived: "Archivado",
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  draft: "Borrador",
  pending: "Pendiente",
  paid: "Pagado",
  processing: "En preparación",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
};

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "draft",
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

export interface ActivityEvent {
  type: "order_paid" | "order_pending" | "order_shipped" | "stock_low" | "stock_out" | "no_action";
  text: string;
  detail?: string;
  timestamp: string;
  link?: string;
}

export interface QuickDashboardData {
  revenue_today_cents: number;
  orders_today: number;
  orders_pending: number;
  revenue_this_month_cents: number;
  avg_order_value_cents: number;
  products_out_of_stock: number;
  products_low_stock: number;
  total_products: number;
  active_products: number;
  total_categories: number;
  total_customers: number;
  new_customers_this_month: number;
  revenue_chart: { date: string; revenue_cents: number; orders: number }[];
  top_products: { name: string; quantity: number; revenue_cents: number }[];
  recent_activity: ActivityEvent[];
  active_discounts: number;
  expired_discounts: number;
}

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  materials: string;
  price_cents: number;
  compare_at_price_cents: number | null;
  sku: string;
  stock_quantity: number;
  seo_title: string;
  seo_description: string;
  category_id: string | null;
  category_name?: string;
  category_ids: string[];
  category_names?: string;
  images: { url: string; color: string }[];
  sizes: string[];
  colors: { name: string; hex: string; slug: string }[];
  in_stock: boolean;
  status: ProductStatus;
  variants: AdminVariant[];
  created_at: string;
}

export interface AdminVariant {
  id: string;
  product_id: string;
  sku: string;
  size: string;
  color_slug: string;
  price_cents: number | null;
  stock_quantity: number;
}

export interface AdminOrder {
  id: string;
  user_id: string;
  status: OrderStatus;
  total_cents: number;
  payment_method: string | null;
  stripe_session_id: string | null;
  stripe_payment_intent: string | null;
  payment_verified_at: string | null;
  items: AdminOrderItem[];
  shipping_address: Record<string, string> | null;
  notes: string;
  tracking_number: string;
  shipping_carrier: string;
  created_at: string;
}

export interface AdminOrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  price_cents: number;
  size: string;
  color: string;
}

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  description: string;
  image: string;
  is_collection: boolean;
  product_count: number;
  children?: AdminCategory[];
}

export interface AdminCustomer {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  order_count: number;
  total_spent: number;
  created_at: string;
}

export interface ProductFormData {
  name: string;
  description: string;
  materials: string;
  price_cents: number;
  status: ProductStatus;
  compare_at_price_cents: number | null;
  sku: string;
  stock_quantity: number;
  seo_title: string;
  seo_description: string;
  category_id: string | null;
  sizes: string[];
  colors: { name: string; hex: string; slug: string }[];
  images: { file?: File; url?: string; color: string }[];
  variants: {
    sku: string;
    size: string;
    color_slug: string;
    price_cents: number | null;
    stock_quantity: number;
  }[];
}

export interface InventoryItem {
  id: string;
  name: string;
  slug: string;
  sku: string;
  stock_quantity: number;
  in_stock: boolean;
  price_cents: number;
  category_name: string | null;
  variants: { id: string; sku: string; size: string; color_slug: string; stock_quantity: number }[];
  created_at: string;
}

export interface AdminDiscount {
  id: string;
  code: string;
  description: string;
  type: "percentage" | "fixed_amount";
  value: number;
  min_purchase_cents: number;
  max_uses: number | null;
  used_count: number;
  active: boolean;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminGiftCard {
  id: string;
  code: string;
  initial_balance_cents: number;
  remaining_balance_cents: number;
  currency: string;
  recipient_email: string;
  sender_email: string;
  message: string;
  active: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  name: string | null;
  status: "active" | "unsubscribed";
  subscribed_at: string;
  unsubscribed_at: string | null;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  image_url: string;
  link_url: string | null;
  link_label: string | null;
  sort_order: number;
  active: boolean;
  text_x: number | null;
  text_y: number | null;
  title_color: string | null;
  subtitle_color: string | null;
  video_url: string | null;
  video_start: number | null;
  video_end: number | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardMetrics {
  revenue_today: number;
  revenue_this_month: number;
  orders_today: number;
  orders_pending: number;
  average_order_value: number;
  products_out_of_stock: number;
  new_customers: number;
  returning_customers: number;
}

export interface RevenuePoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  product_id: string;
  name: string;
  quantity: number;
  revenue: number;
}

export interface LowStockProduct {
  name: string;
  stock_quantity: number;
  in_stock: boolean;
}

export interface RecentCustomerEntry {
  id: string;
  email: string;
  name: string;
  total_spent: number;
  order_count: number;
}

export interface NotificationSettings {
  order_confirmed: boolean;
  order_shipped: boolean;
  order_delivered: boolean;
  low_stock_alert: boolean;
  new_subscriber: boolean;
  notification_email: string | null;
}

export interface GeneralSettings {
  store_name: string;
  store_description: string;
  store_currency: string;
  store_timezone: string;
  store_language: string;
}
export interface StoreInfoSettings {
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  email: string;
}
export interface BrandSettings {
  brand_name: string;
  brand_tagline: string;
  brand_about: string;
}
export interface LogoSettings {
  logo_url: string;
  logo_alt: string;
  favicon_url: string;
}
export interface ColorSettings {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}
export interface TypographySettings {
  heading_font: string;
  body_font: string;
  base_font_size: number;
}
export interface PaymentSettings {
  stripe_publishable_key: string;
  stripe_secret_key: string;
  stripe_webhook_secret: string;
  paypal_client_id: string;
  test_mode: boolean;
  bizum_enabled: boolean;
  bizum_phone: string;
}
export interface ShippingSettings {
  free_shipping_threshold: number;
  default_weight_unit: string;
  handling_fee: number;
  shipping_zones: string;
}
export interface TaxSettings {
  default_tax_rate: number;
  tax_inclusive_pricing: boolean;
  charge_tax_on_shipping: boolean;
  tax_jurisdictions: string;
}
export interface EmailTemplateSettings {
  order_confirmation_subject: string;
  order_confirmation_body: string;
  shipping_confirmation_subject: string;
  shipping_confirmation_body: string;
}
export interface NotificationSettingsAdmin {
  order_confirmed: boolean;
  order_shipped: boolean;
  order_delivered: boolean;
  low_stock_alert: boolean;
  new_subscriber: boolean;
  notification_email: string | null;
}
export interface SeoSettings {
  global_title: string;
  global_description: string;
  og_image: string;
  google_analytics_id: string;
  facebook_pixel_id: string;
  robots_txt: string;
  custom_head_scripts: string;
}
export interface DomainSettings {
  primary_domain: string;
  redirect_www: boolean;
  force_https: boolean;
  custom_domains: string;
}
export interface LegalSettings {
  privacy_policy: string;
  terms_of_service: string;
  refund_policy: string;
  shipping_policy: string;
  cookie_policy: string;
}
export interface SocialSettings {
  instagram: string;
  facebook: string;
  twitter: string;
  pinterest: string;
  tiktok: string;
  youtube: string;
  linkedin: string;
}