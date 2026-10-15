import Image from "next/image";
import Link from "next/link";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { gymPhotos } from "@/lib/data";
import { ArrowRight, Play } from "lucide-react";

const collage = gymPhotos.slice(0, 4);

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
            <p className="text-lg text-white/70 leading-relaxed max-w-xl mb-4">
              Dirigido por nuestra especialista CAFYD María Pinto.
            </p>
            <p className="text-white/60 leading-relaxed max-w-xl mb-8">
              Un espacio equipado para la readaptación y el entrenamiento, donde trabajamos desde la
              valoración funcional hasta el retorno seguro al deporte, con un plan adaptado a cada
              persona.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link
                href="/gym"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-teal text-white font-display font-semibold text-[15px] rounded-full shadow-[0_4px_24px_rgba(0,184,212,0.3)] hover:bg-cyan hover:-translate-y-0.5 transition-all"
              >
                Ver más
                <ArrowRight className="w-[18px] h-[18px]" aria-hidden />
              </Link>
              <Link
                href="/gym#video"
                className="inline-flex items-center gap-2 px-7 py-3.5 border border-white/30 text-white font-display font-semibold text-[15px] rounded-full hover:border-white hover:bg-white/8 transition-all"
              >
                <Play className="w-4 h-4" aria-hidden />
                Ver el vídeo
              </Link>
            </div>
          </ScrollReveal>

          {/* Collage */}
          <ScrollReveal delay={150}>
            <Link
              href="/gym"
              className="group grid grid-cols-2 gap-3 sm:gap-4"
              aria-label="Ver todas las fotos del gimnasio"
            >
              {collage.map((photo, i) => (
                <div
                  key={photo}
                  className="relative aspect-square rounded-2xl overflow-hidden shadow-[0_18px_50px_rgba(0,0,0,0.3)] ring-1 ring-white/10"
                >
                  <Image
                    src={photo}
                    alt={`Instalaciones de gym y readaptación de Phyresport ${i + 1}`}
                    fill
                    sizes="(min-width: 1024px) 280px, 45vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
              ))}
            </Link>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
