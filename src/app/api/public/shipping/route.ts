import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const revalidate = 60;

export async function GET() {
  const supabase = createAdminClient();
  const { data } = await supabase.from("settings").select("value").eq("key", "shipping").single();
  const shipping = (data?.value ?? {}) as Record<string, unknown>;
  return NextResponse.json({
    shipping_rate: Number(shipping.shipping_rate ?? 8),
    free_shipping_threshold: Number(shipping.free_shipping_threshold ?? 150),
  });
}