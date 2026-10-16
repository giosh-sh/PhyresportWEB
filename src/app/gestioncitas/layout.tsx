import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isStaff } from "@/lib/admin-auth";
import HeaderWrapper from "@/components/layout/header-wrapper";
import { Footer } from "@/components/layout/footer";
import { WhatsAppFloat } from "@/components/ui/whatsapp-float";

export default async function GestionCitasLayout({ children }: { children: React.ReactNode }) {
  const { userId, redirectToSignIn } = await auth();
  if (!userId) return redirectToSignIn();
  if (!(await isStaff(userId))) redirect("/");

  return (
    <>
      <HeaderWrapper solid />
      <main className="min-h-screen bg-ice/40 pt-24 pb-16">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6">{children}</div>
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
