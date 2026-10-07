import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Hand,
  Phone,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { services, siteConfig } from "@/lib/data";
import HeaderWrapper from "@/components/layout/header-wrapper";
import { Footer } from "@/components/layout/footer";
import { WhatsAppFloat } from "@/components/ui/whatsapp-float";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

interface Props {
  params: Promise<{ slug: string }>;
}

const serviceIcons: Record<string, LucideIcon> = {
  activity: Activity,
  hand: Hand,
  waves: Waves,
};

export async function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = services.find((s) => s.slug === slug);
  if (!service) return {};
  return {
    title: service.title,
    description: service.description,
  };
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  const service = services.find((s) => s.slug === slug);
  if (!service) notFound();

  const Icon = serviceIcons[service.icon] ?? Activity;
  const currentIndex = services.indexOf(service);
  const prevService = currentIndex > 0 ? services[currentIndex - 1] : null;
  const nextService = currentIndex < services.length - 1 ? services[currentIndex + 1] : null;

  return (
    <>
      <HeaderWrapper />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-navy pt-28 pb-16 lg:pt-40 lg:pb-24">
          <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy-light to-cyan/20" />
          <div className="relative z-10 mx-auto max-w-6xl px-6">
            <Link
              href="/servicios"
              className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors focus-visible:text-white"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden />
              Todos los servicios
            </Link>

            <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 items-center">
              {/* Text */}
              <div>
                <p className="inline-flex items-center gap-2 font-stats text-[13px] font-medium tracking-widest uppercase text-teal mb-5 animate-fade-up">
                  <Icon className="w-4 h-4" aria-hidden />
                  {service.eyebrow}
                </p>
                <h1 className="font-display text-[clamp(2rem,5vw,3.75rem)] font-extrabold leading-[1.05] tracking-tight text-white mb-6 animate-fade-up-delay-1">
                  {service.title}
                </h1>
                <p className="text-lg text-white/70 max-w-xl leading-relaxed mb-9 animate-fade-up-delay-2">
                  {service.description}
                </p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-fade-up-delay-3">
                  <a
                    href={siteConfig.whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-teal text-white font-display font-semibold text-sm rounded-full hover:bg-cyan hover:-translate-y-0.5 transition-all"
                  >
                    Reservar cita
                    <ArrowRight className="w-4 h-4" aria-hidden />
                  </a>
                  <a
                    href={siteConfig.phoneHref}
                    className="inline-flex items-center gap-2 px-6 py-3 border border-white/30 text-white font-display font-semibold text-sm rounded-full hover:border-white hover:bg-white/10 transition-all"
                  >
                    <Phone className="w-4 h-4" aria-hidden />
                    Llamar · {siteConfig.phone}
                  </a>
                </div>
              </div>

              {/* Framed image */}
              <div className="relative animate-fade-up-delay-2">
                <div className="relative aspect-[4/3] rounded-2xl bg-white p-4 lg:p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] overflow-hidden">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-contain"
                    priority
                    sizes="(min-width: 1024px) 560px, 100vw"
                  />
                  <span aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-teal/80" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <ScrollReveal>
              <div className="max-w-2xl mb-12 lg:mb-16">
                <div aria-hidden className="h-[3px] w-10 bg-teal mb-6" />
                <p className="text-xl lg:text-2xl text-gray-500 leading-relaxed">
                  {service.content.intro}
                </p>
              </div>
            </ScrollReveal>

            {/* Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {service.content.sections.map((section, i) => (
                <ScrollReveal key={i} delay={i * 80}>
                  <div className="h-full rounded-2xl border border-gray-100 bg-white p-8 lg:p-10 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                    <div aria-hidden className="h-[3px] w-10 bg-teal mb-6" />
                    <h2 className="font-display text-xl lg:text-[22px] font-bold text-navy mb-3">
                      {section.title}
                    </h2>
                    <p className="text-gray-500 leading-relaxed">{section.text}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>

            {/* Source */}
            {service.source && (
              <ScrollReveal>
                <p className="mt-12 text-sm text-gray-400 italic text-center">
                  Fuente: {service.source}
                </p>
              </ScrollReveal>
            )}

            {/* CTA band */}
            <ScrollReveal delay={100}>
              <div className="relative mt-16 lg:mt-24 overflow-hidden rounded-2xl bg-navy px-8 py-12 lg:px-16 lg:py-16 text-center">
                <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy-light to-cyan/20" />
                <div className="relative z-10 max-w-xl mx-auto">
                  <h2 className="font-display text-2xl lg:text-3xl font-bold text-white mb-3">
                    ¿Tienes una molestia que no se resuelve?
                  </h2>
                  <p className="text-white/70 leading-relaxed mb-8">
                    Cuéntanos tu caso. Empezamos con una valoración y un plan de tratamiento a tu
                    medida.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <a
                      href={siteConfig.whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-teal text-white font-display font-semibold text-sm rounded-full hover:bg-cyan hover:-translate-y-0.5 transition-all"
                    >
                      Pedir cita por WhatsApp
                      <ArrowRight className="w-4 h-4" aria-hidden />
                    </a>
                    <a
                      href={siteConfig.phoneHref}
                      className="inline-flex items-center gap-2 px-6 py-3 border border-white/30 text-white font-display font-semibold text-sm rounded-full hover:border-white hover:bg-white/10 transition-all"
                    >
                      <Phone className="w-4 h-4" aria-hidden />
                      Llamar · {siteConfig.phone}
                    </a>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Navigation */}
            <nav
              className="mt-16 lg:mt-24 pt-8 border-t border-gray-200 flex justify-between gap-6"
              aria-label="Otros servicios"
            >
              {prevService ? (
                <Link href={`/servicios/${prevService.slug}`} className="group flex items-center gap-3 min-w-0">
                  <ArrowLeft className="w-4 h-4 text-gray-300 group-hover:text-teal shrink-0" aria-hidden />
                  <span className="min-w-0">
                    <span className="block font-stats text-[11px] uppercase tracking-widest text-gray-400">
                      Anterior
                    </span>
                    <span className="block font-display font-bold text-navy truncate group-hover:text-teal transition-colors">
                      {prevService.shortTitle}
                    </span>
                  </span>
                </Link>
              ) : (
                <div />
              )}
              {nextService ? (
                <Link href={`/servicios/${nextService.slug}`} className="group flex items-center gap-3 text-right min-w-0">
                  <span className="min-w-0">
                    <span className="block font-stats text-[11px] uppercase tracking-widest text-gray-400">
                      Siguiente
                    </span>
                    <span className="block font-display font-bold text-navy truncate group-hover:text-teal transition-colors">
                      {nextService.shortTitle}
                    </span>
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-teal shrink-0" aria-hidden />
                </Link>
              ) : (
                <div />
              )}
            </nav>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}