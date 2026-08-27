import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const revalidate = 60;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: product, error } = await supabase
    .from("products")
    .select("*, categories(name), product_variants(*)")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...product,
    category_name: product.categories?.name ?? null,
    categories: undefined,
  });
}