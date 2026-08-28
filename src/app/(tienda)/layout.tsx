import HeaderWrapper from "@/components/layout/header-wrapper";
import { Footer } from "@/components/layout/footer";
import { WhatsAppFloat } from "@/components/ui/whatsapp-float";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <HeaderWrapper solid />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}