import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { ImageIcon } from "lucide-react";

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

          {/* Gallery placeholder */}
          {/* TODO: sustituir estos huecos por la galería real de fotos de la zona */}
          <ScrollReveal delay={150}>
            <div className="grid grid-cols-2 gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="aspect-video rounded-xl border border-dashed border-white/20 bg-white/5 flex items-center justify-center text-white/40"
                  aria-hidden
                >
                  <ImageIcon className="w-6 h-6" aria-hidden />
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
