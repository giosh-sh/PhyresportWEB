import Image from "next/image";
import Link from "next/link";
import { team } from "@/lib/data";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { ArrowRight } from "lucide-react";

const founder = team[0];

export function ExperienceSection() {
  return (
    <section className="py-24 lg:py-28" id="experiencia">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Portrait */}
          <ScrollReveal>
            <div className="relative max-w-md mx-auto lg:mx-0">
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-ice shadow-xl">
                <Image
                  src={founder.image}
                  alt={founder.fullName}
                  fill
                  className="object-cover object-top"
                  sizes="(min-width: 1024px) 480px, 100vw"
                  loading="lazy"
                />
              </div>
              <div className="absolute -bottom-5 right-0 lg:right-[-24px] bg-navy text-white rounded-xl p-5 shadow-xl max-w-[220px] border-l-4 border-teal">
                <p className="font-display text-base font-bold mb-1">Grupo EPI Advanced</p>
                <p className="text-xs text-white/70">Profesor desde 2014</p>
              </div>
            </div>
          </ScrollReveal>

          {/* Text */}
          <ScrollReveal delay={150}>
            <p className="font-stats text-[13px] font-medium tracking-widest uppercase text-teal mb-3">
              Experiencia
            </p>
            <h2 className="font-display text-[clamp(1.75rem,3.5vw,2.75rem)] font-bold leading-tight tracking-tight text-charcoal mb-6">
              Más de 15 años a la vanguardia de la fisioterapia avanzada
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed mb-8">
              Javier Adrián González Fernández es profesor del Grupo EPI Advanced desde 2014 y uno
              de los pioneros en Canarias en la aplicación de la electrólisis percutánea del Grupo
              EPI, técnica que incorporó a su práctica clínica desde 2010. Fue además uno de los
              primeros profesionales en Canarias en apostar por esta tecnología, acumulando una
              amplia experiencia clínica y docente en fisioterapia avanzada y tratamiento del dolor
              y Fisioterapeuta de la selección española de Squash.
            </p>
            <Link
              href="/equipo"
              className="inline-flex items-center gap-2 font-display font-semibold text-teal hover:text-cyan transition-colors group"
            >
              Conoce a nuestro equipo
              <ArrowRight className="w-[18px] h-[18px] group-hover:translate-x-1 transition-transform" />
            </Link>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
