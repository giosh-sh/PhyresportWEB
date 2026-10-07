import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { team } from "@/lib/data";
import HeaderWrapper from "@/components/layout/header-wrapper";
import { Footer } from "@/components/layout/footer";
import { WhatsAppFloat } from "@/components/ui/whatsapp-float";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Phone, ArrowUpRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Nuestro Equipo",
  description:
    "Conoce al equipo de fisioterapeutas, osteópatas y especialistas en nutrición de Phyresport en Santa Cruz de Tenerife.",
};

const disciplines = [
  { label: "especialistas", value: String(team.length) },
  { label: "disciplinas", value: "3" },
  { label: "EPI® Ecoguiada", value: "1 técnica" },
];

export default function EquipoPage() {
  return (
    <>
      <HeaderWrapper />
      <main>
        {/* Hero */}
        <section className="relative pt-32 pb-20 lg:pt-44 lg:pb-28 bg-navy overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy-light to-cyan/20" />
          <div className="relative z-10 mx-auto max-w-6xl px-6">
            <p className="font-stats text-[13px] font-medium tracking-widest uppercase text-teal mb-5 animate-fade-up">
              Nuestro equipo
            </p>
            <h1 className="font-display text-[clamp(2.25rem,6vw,4.5rem)] font-extrabold leading-[1.05] tracking-tight text-white max-w-3xl animate-fade-up-delay-1">
              Las manos detrás de cada recuperación
            </h1>
            <div className="mt-8 h-[3px] w-full max-w-md bg-white/15 rounded-full overflow-hidden animate-fade-up-delay-2">
              <div className="h-full bg-teal animate-draw-line" />
            </div>
            <p className="mt-8 text-lg text-white/70 max-w-xl animate-fade-up-delay-3">
              Siete especialistas en fisioterapia, osteopatía y terapia manual. Formación continua,
              técnica EPI® Ecoguiada y un objetivo: que vuelvas a moverte sin dolor.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 font-stats text-sm text-white/60 animate-fade-up-delay-4">
              {disciplines.map((d) => (
                <span key={d.label}>
                  <strong className="font-bold text-teal">{d.value}</strong> {d.label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Roster */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <div className="border-t border-gray-200">
              {team.map((member, i) => (
                <ScrollReveal key={member.slug} delay={i * 60}>
                  <Link
                    href={`/equipo/${member.slug}`}
                    className="group flex items-stretch gap-5 sm:gap-8 lg:gap-12 border-b border-gray-200 py-8 lg:py-10 hover:bg-ice/70 transition-colors focus-visible:bg-ice/70"
                  >
                    {/* Portrait */}
                    <div className="relative w-20 h-24 sm:w-28 sm:h-32 lg:w-40 lg:h-44 shrink-0 overflow-hidden rounded-lg bg-ice">
                      <Image
                        src={member.image}
                        alt={member.fullName}
                        fill
                        className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                        loading="lazy"
                        sizes="(min-width: 1024px) 160px, (min-width: 640px) 112px, 80px"
                      />
                      <span
                        aria-hidden
                        className="absolute inset-x-0 top-0 h-full bg-gradient-to-b from-teal/0 via-teal/30 to-teal/0 -translate-y-full transition-transform duration-700 ease-out group-hover:translate-y-full pointer-events-none"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 flex flex-col justify-center min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                        <h2 className="font-display text-xl lg:text-2xl font-bold text-navy group-hover:text-teal transition-colors">
                          {member.name}
                        </h2>
                        <p className="font-stats text-xs font-semibold text-teal uppercase tracking-wider">
                          {member.role}
                        </p>
                      </div>
                      <p className="mt-2 text-sm lg:text-[15px] text-gray-500 leading-relaxed max-w-2xl">
                        {member.description}
                      </p>
                      {member.phone && (
                        <span className="mt-3 inline-flex items-center gap-1.5 font-stats text-sm text-gray-400">
                          <Phone className="w-3.5 h-3.5" aria-hidden />
                          {member.phone}
                        </span>
                      )}
                    </div>

                    <ArrowUpRight
                      className="self-center w-5 h-5 lg:w-6 lg:h-6 text-gray-300 group-hover:text-teal transition-colors shrink-0"
                      aria-hidden
                    />
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