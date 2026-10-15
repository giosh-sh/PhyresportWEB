import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Product } from "@/types/product";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (m) => `\\${m}`);
}

export function getVariantMaxStock(product: Product, size: string, color: string): number {
  const variants = product.variants;
  if (variants && variants.length > 0) {
    const variant = variants.find(
      (v) => (v.size || "") === (size || "") && (v.color_slug || "") === (color || "")
    );
    if (variant) {
      return variant.stock_quantity ?? 0;
    }
  }
  return product.stock_quantity ?? 99;
}

const CURRENCY_LOCALE_MAP: Record<string, string> = {
  USD: "en-US",
  EUR: "es-ES",
  GBP: "en-GB",
};

export function formatPrice(priceCents: number, currency?: string, locale?: string): string {
  const curr = currency || "EUR";
  return new Intl.NumberFormat(locale || CURRENCY_LOCALE_MAP[curr] || "es-ES", {
    style: "currency",
    currency: curr,
  }).format(priceCents / 100);
}

export function formatPriceRaw(price: number, currency?: string, locale?: string): string {
  const curr = currency || "EUR";
  return new Intl.NumberFormat(locale || CURRENCY_LOCALE_MAP[curr] || "es-ES", {
    style: "currency",
    currency: curr,
  }).format(price);
}

/**
 * Convierte un color hex (#RRGGBB o #RGB) + opacidad (0-100) a rgba().
 * Si el color no es válido, usa el navy de Phyresport.
 */
export function hexToRgba(hex: string | null | undefined, opacity = 100): string {
  const fallback = "11, 29, 58"; // #0B1D3A
  let value = (hex || "").trim().replace("#", "");
  if (value.length === 3) {
    value = value.split("").map((c) => c + c).join("");
  }
  const valid = /^[0-9a-fA-F]{6}$/.test(value);
  const r = valid ? parseInt(value.slice(0, 2), 16) : 11;
  const g = valid ? parseInt(value.slice(2, 4), 16) : 29;
  const b = valid ? parseInt(value.slice(4, 6), 16) : 58;
  const a = Math.min(100, Math.max(0, opacity)) / 100;
  if (!valid) return `rgba(${fallback}, ${a})`;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}