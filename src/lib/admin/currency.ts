"use server";

import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function getCurrencyConfig(): Promise<{ code: string; locale: string }> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "general")
      .single();
    const general = (data?.value ?? {}) as Record<string, unknown>;
    const code = String(general.store_currency || "EUR");
    const locale = code === "EUR" ? "es-ES" : code === "USD" ? "en-US" : "es-ES";
    return { code, locale };
  } catch {
    return { code: "EUR", locale: "es-ES" };
  }
}