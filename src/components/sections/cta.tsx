import Link from "next/link";
import { siteConfig } from "@/lib/data";
import { Phone, ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="relative py-20 lg:py-24 bg-gradient-to-br from-navy via-navy-light to-cyan/40 overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-teal/[0.07] blur-3xl" />

      <div className="relative z-10 mx-auto max-w-2xl px-6 text-center">
        <h2 className="font-display text-[clamp(1.75rem,3.5vw,2.75rem)] font-bold leading-tight text-white mb-4">
          ¿Listo para empezar tu recuperación?
        </h2>
        <p className="text-lg text-white/70 mb-2 max-w-md mx-auto">
          Reserva tu primera valoración y descubre cómo podemos ayudarte a volver a moverte sin
          límites.
        </p>
        <p className="text-sm text-teal font-stats font-medium mb-8">
          Sin compromiso. Te decimos si podemos ayudarte.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="/citas"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-teal text-white font-display font-semibold text-[15px] rounded-full shadow-[0_4px_24px_rgba(0,184,212,0.3)] hover:bg-cyan hover:-translate-y-0.5 transition-all"
          >
            Reservar valoración
            <ArrowRight className="w-[18px] h-[18px]" />
          </Link>
          <a
            href={siteConfig.phoneHref}
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 border border-white/30 text-white font-display font-semibold text-[15px] rounded-full hover:border-white hover:bg-white/8 transition-all"
          >
            <Phone className="w-4 h-4" />
            Llamar: {siteConfig.phone}
          </a>
        </div>
      </div>
    </section>
  );
}
