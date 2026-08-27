import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const { code, subtotalCents } = await request.json();
    if (!code || typeof subtotalCents !== "number") {
      return NextResponse.json({ error: "Código requerido" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const now = new Date().toISOString();

    const { data: discount } = await supabase
      .from("discounts")
      .select("id, type, value, min_purchase_cents, max_uses, used_count, active, starts_at, expires_at")
      .eq("code", code.toUpperCase())
      .maybeSingle();

    if (!discount || discount.active === false) {
      return NextResponse.json({ error: "Código no válido" }, { status: 400 });
    }
    if (discount.starts_at && discount.starts_at > now) {
      return NextResponse.json({ error: "Este código aún no está activo" }, { status: 400 });
    }
    if (discount.expires_at && discount.expires_at < now) {
      return NextResponse.json({ error: "Este código ha expirado" }, { status: 400 });
    }
    if (discount.min_purchase_cents && subtotalCents < discount.min_purchase_cents) {
      return NextResponse.json(
        { error: "Este código requiere un pedido mínimo" },
        { status: 400 }
      );
    }
    if (discount.max_uses != null && (discount.used_count ?? 0) >= discount.max_uses) {
      return NextResponse.json(
        { error: "Este código ya no está disponible" },
        { status: 400 }
      );
    }

    let discountAmountCents = 0;
    if (discount.type === "percentage") {
      discountAmountCents = Math.round((subtotalCents * discount.value) / 100);
    } else {
      discountAmountCents = Math.min(discount.value, subtotalCents);
    }

    return NextResponse.json({ discountAmountCents });
  } catch {
    return NextResponse.json({ error: "Error al validar el código" }, { status: 500 });
  }
}