import { auth } from "@clerk/nextjs/server";
import { Header } from "@/components/layout/header";
import { getCategories } from "@/services/supabase-store";
import { isAdmin } from "@/lib/admin-auth";
import type { Category } from "@/types/product";

function buildTree(flat: Category[]): Category[] {
  const map = new Map<string, Category>();
  for (const c of flat) map.set(c.id, { ...c, children: [] });

  const roots: Category[] = [];
  for (const c of map.values()) {
    if (c.parent_id && map.has(c.parent_id)) {
      map.get(c.parent_id)!.children!.push(c);
    } else {
      roots.push(c);
    }
  }
  return roots;
}

export default async function HeaderWrapper({ solid = false }: { solid?: boolean }) {
  let categories: Category[] = [];
  try {
    categories = buildTree(await getCategories());
  } catch {}

  let admin = false;
  try {
    const { userId } = await auth();
    admin = await isAdmin(userId);
  } catch {}

  return <Header solid={solid} categories={categories} isAdmin={admin} />;
}
