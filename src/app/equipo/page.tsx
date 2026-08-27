import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { team } from "@/lib/data";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppFloat } from "@/components/ui/whatsapp-float";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export const metadata: Metadata = {
  title: "Nuestro Equipo",
  description:
    "Conoce al equipo de fisioterapeutas especializados de Phyresport en Santa Cruz de Tenerife.",
};

export default function EquipoPage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-20 bg-navy">
          <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
            <p className="font-stats text-[13px] font-medium tracking-widest uppercase text-teal mb-3">
              Nuestro equipo
            </p>
            <h1 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-extrabold leading-tight tracking-tight text-white mb-4">
              Especialistas comprometidos con tu bienestar
            </h1>
            <p className="text-lg text-white/70 max-w-xl mx-auto">
              Un equipo multidisciplinar con formación continua y experiencia clínica real.
            </p>
          </div>
        </section>

        {/* Team Grid */}
        <section className="py-16 lg:py-20">
          <div className="mx-auto max-w-5xl px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {team.map((member, i) => (
                <ScrollReveal key={member.slug} delay={i * 80}>
                  <Link
                    href={`/equipo/${member.slug}`}
                    className="group block text-center p-6 rounded-xl hover:bg-ice transition-all"
                  >
                    <div className="relative w-[140px] h-[140px] mx-auto mb-5">
                      <div className="absolute inset-[-4px] rounded-full border-2 border-dashed border-transparent group-hover:border-teal/30 transition-colors" />
                      <Image
                        src={member.image}
                        alt={member.fullName}
                        width={140}
                        height={140}
                        className="w-[140px] h-[140px] rounded-full object-cover object-top border-[3px] border-gray-200 group-hover:border-teal transition-colors"
                        loading="lazy"
                      />
                    </div>
                    <h3 className="font-display text-[17px] font-bold text-navy mb-1">
                      {member.name}
                    </h3>
                    <p className="text-xs font-semibold text-teal uppercase tracking-wider mb-2">
                      {member.role}
                    </p>
                    <p className="text-sm text-gray-500 leading-relaxed">{member.description}</p>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
