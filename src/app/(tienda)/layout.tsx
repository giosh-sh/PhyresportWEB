import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppFloat } from "@/components/ui/whatsapp-float";
import CartDrawerWrapper from "@/components/CartDrawerWrapper";
import FavoritesHydrator from "@/components/FavoritesHydrator";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppFloat />
      <CartDrawerWrapper />
      <FavoritesHydrator />
    </>
  );
}