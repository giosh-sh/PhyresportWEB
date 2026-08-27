import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const revalidate = 60;

export async function GET() {
  const supabase = createAdminClient();
  const { data } = await supabase.from("settings").select("value").eq("key", "payments").single();
  const payments = (data?.value ?? {}) as Record<string, unknown>;
  return NextResponse.json({
    stripe_enabled: payments.stripe_enabled !== false,
    bizum_enabled: payments.bizum_enabled === true,
    bizum_phone: payments.bizum_phone ?? "",
    paypal_enabled: payments.paypal_enabled === true,
  });
}