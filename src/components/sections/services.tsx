import Link from "next/link";
import { services } from "@/lib/data";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import {
  Activity,
  Hand,
  Footprints,
  Waves,
  SportShoe,
  BookOpen,
  ArrowRight,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  activity: Activity,
  hand: Hand,
  footprints: Footprints,
  waves: Waves,
  shoe: SportShoe,
  book: BookOpen,
};

export function ServicesSection() {
  return (
    <section className="py-24 lg:py-28 bg-ice" id="servicios">
      <div className="mx-auto max-w-7xl px-6">
        <ScrollReveal>
          <div className="text-center mb-16">
            <p className="font-stats text-[13px] font-medium tracking-widest uppercase text-teal mb-3">
              Servicios
            </p>
            <h2 className="font-display text-[clamp(1.75rem,3.5vw,2.75rem)] font-bold leading-tight tracking-tight text-charcoal mb-4">
              Tratamientos especializados
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Cada servicio está diseñado para ofrecer una recuperación precisa y resultados
              medibles.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, i) => {
            const Icon = iconMap[service.icon] || Activity;
            return (
              <ScrollReveal key={service.slug} delay={i * 80}>
                <Link
                  href={`/servicios/${service.slug}`}
                  className="group block bg-white rounded-xl p-7 border border-gray-200 border-l-[3px] border-l-teal shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-teal transition-all relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-teal/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="relative">
                    <div className="w-12 h-12 rounded-lg bg-ice flex items-center justify-center text-teal mb-5 group-hover:bg-teal group-hover:text-white transition-all">
                      <Icon className="w-6 h-6 stroke-[1.5]" />
                    </div>

                    <h3 className="font-display text-lg font-bold text-navy mb-2.5">
                      {service.title}
                    </h3>
                    <p className="text-[15px] text-gray-500 leading-relaxed mb-4">
                      {service.description}
                    </p>
                    <span className="inline-flex items-center gap-1.5 font-display text-sm font-semibold text-teal group-hover:gap-2.5 transition-all">
                      Saber más
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
