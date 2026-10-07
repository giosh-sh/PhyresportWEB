import HeaderWrapper from "@/components/layout/header-wrapper";
import { Footer } from "@/components/layout/footer";
import { HeroSection } from "@/components/sections/hero";
import { ExperienceSection } from "@/components/sections/experience";
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
        <ExperienceSection />
        <TechnologySection />
        <GymSection />
        <AboutSection />
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
