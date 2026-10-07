import HeaderWrapper from "@/components/layout/header-wrapper";
import { Footer } from "@/components/layout/footer";
import { HeroSection } from "@/components/sections/hero";
import { TechnologySection } from "@/components/sections/technology";
import { GymSection } from "@/components/sections/gym";
import AboutSection from "@/components/sections/about";
import { ServicesSection } from "@/components/sections/services";
import { TeamSection } from "@/components/sections/team";
import { CoursesSection } from "@/components/sections/courses";
import { CTASection } from "@/components/sections/cta";
import { WhatsAppFloat } from "@/components/ui/whatsapp-float";

export default function HomePage() {
  return (
    <>
      <HeaderWrapper />
      <main>
        <HeroSection />
        <AboutSection />
        <GymSection />
        <TechnologySection />
        <ServicesSection />
        <TeamSection />
        <CoursesSection />
        <CTASection />
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
