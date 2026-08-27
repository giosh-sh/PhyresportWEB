import { ShopPageShell } from "@/components/ShopCatalog";
import type { ShopSearchParams } from "@/components/ShopCatalog";

export default async function TiendaPage({
  searchParams,
}: {
  searchParams: Promise<ShopSearchParams>;
}) {
  return <ShopPageShell searchParams={searchParams} />;
}