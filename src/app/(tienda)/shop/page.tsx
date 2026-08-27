import { ShopPageShell } from "@/components/ShopCatalog";
import type { ShopSearchParams } from "@/components/ShopCatalog";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<ShopSearchParams>;
}) {
  return <ShopPageShell searchParams={searchParams} />;
}