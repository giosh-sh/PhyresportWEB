"use server";

import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export interface AdminThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  primaryHsl: string;
  accentHsl: string;
  ringHsl: string;
}

function hexToHsl(hex: string): string {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) return "";
  const full = m[1];
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
        break;
      case g:
        h = ((b - r) / d + 2) * 60;
        break;
      default:
        h = ((r - g) / d + 4) * 60;
    }
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

const DEFAULTS: AdminThemeColors = {
  primary: "#00B8D4",
  secondary: "#0B1D3A",
  accent: "#0891B2",
  background: "#0d0d0d",
  text: "#f0f0f0",
  primaryHsl: "189 100% 42%",
  accentHsl: "189 100% 36%",
  ringHsl: "189 100% 42%",
};

function toHex(v: unknown): string {
  return typeof v === "string" && /^#?[0-9a-fA-F]{6}$/.test(v.trim()) ? v.trim() : "";
}

export async function getAdminTheme(): Promise<AdminThemeColors> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "colors")
      .single();
    const saved = (data?.value ?? {}) as Record<string, unknown>;

    const primary = toHex(saved.primary) || DEFAULTS.primary;
    const accent = toHex(saved.accent) || DEFAULTS.accent;

    return {
      primary,
      secondary: toHex(saved.secondary) || DEFAULTS.secondary,
      accent,
      background: toHex(saved.background) || DEFAULTS.background,
      text: toHex(saved.text) || DEFAULTS.text,
      primaryHsl: hexToHsl(primary) || DEFAULTS.primaryHsl,
      accentHsl: hexToHsl(accent) || DEFAULTS.accentHsl,
      ringHsl: hexToHsl(primary) || DEFAULTS.ringHsl,
    };
  } catch {
    return DEFAULTS;
  }
}