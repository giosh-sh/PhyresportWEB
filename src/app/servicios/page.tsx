import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { services } from "@/lib/data";
import HeaderWrapper from "@/components/layout/header-wrapper";
import { Footer } from "@/components/layout/footer";
import { WhatsAppFloat } from "@/components/ui/whatsapp-float";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Servicios",
  description:
    "Todos los servicios de Phyresport: fisioterapia, osteopatía y terapia manual.",
};

export default function ServiciosPage() {
  return (
    <>
      <HeaderWrapper />
      <main>
        {/* Hero */}
        <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-20 bg-navy">
          <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
            <p className="font-stats text-[13px] font-medium tracking-widest uppercase text-teal mb-3">
              Servicios
            </p>
            <h1 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-extrabold leading-tight tracking-tight text-white mb-4">
              Nuestros Servicios
            </h1>
            <p className="text-lg text-white/70 max-w-xl mx-auto">
              Tratamientos especializados para tu recuperación y rendimiento deportivo.
            </p>
          </div>
        </section>

        {/* Services List */}
        <section className="py-16 lg:py-20">
          <div className="mx-auto max-w-5xl px-6 space-y-8">
            {services.map((service, i) => (
              <ScrollReveal key={service.slug} delay={i * 80}>
                <Link
                  href={`/servicios/${service.slug}`}
                  className="group block bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 hover:shadow-xl transition-all grid grid-cols-1 md:grid-cols-[280px_1fr]"
                >
                  <div className="relative h-48 md:h-auto overflow-hidden bg-ice">
                    <Image
                      src={service.image}
                      alt={service.title}
                      width={280}
                      height={200}
                      className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-8 flex flex-col justify-center">
                    <p className="font-stats text-xs font-medium text-teal uppercase tracking-wider mb-2">
                      {service.eyebrow}
                    </p>
                    <h2 className="font-display text-xl lg:text-2xl font-bold text-navy mb-3">
                      {service.title}
                    </h2>
                    <p className="text-gray-500 leading-relaxed mb-4">{service.description}</p>
                    <span className="inline-flex items-center gap-2 font-display font-semibold text-teal text-sm group-hover:gap-3 transition-all">
                      Ver detalle
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
