import Image from "next/image";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export function GymSection() {
  return (
    <section
      className="relative py-24 lg:py-28 bg-gradient-to-br from-navy via-navy-light to-cyan/40 overflow-hidden"
      id="gym"
    >
      {/* Ambient glow */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-teal/[0.07] blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text */}
          <ScrollReveal>
            <p className="font-stats text-[13px] font-medium tracking-widest uppercase text-teal mb-3">
              Gym
            </p>
            <h2 className="font-display text-[clamp(1.75rem,3.5vw,2.75rem)] font-bold leading-tight tracking-tight text-white mb-5">
              Gym y Readaptación de Lesiones Deportivas
            </h2>
            <p className="text-lg text-white/70 leading-relaxed max-w-xl">
              Dirigido por nuestra especialista CAFYD María Pinto.
            </p>
          </ScrollReveal>

          {/* Image */}
          {/* TODO: sustituir por la galería completa de la zona cuando haya más fotos */}
          <ScrollReveal delay={150}>
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
              <Image
                src="/img/maria-3.jpeg"
                alt="María Pinto en la zona de Gym y Readaptación de Phyresport"
                fill
                sizes="(min-width: 1024px) 560px, 100vw"
                className="object-cover"
                loading="lazy"
              />
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
