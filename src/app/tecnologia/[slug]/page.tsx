import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, Check, Phone } from "lucide-react";
import { machines, siteConfig } from "@/lib/data";
import HeaderWrapper from "@/components/layout/header-wrapper";
import { Footer } from "@/components/layout/footer";
import { WhatsAppFloat } from "@/components/ui/whatsapp-float";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return machines.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const machine = machines.find((m) => m.slug === slug);
  if (!machine) return {};
  return {
    title: machine.name,
    description: machine.text,
  };
}

export default async function MachinePage({ params }: Props) {
  const { slug } = await params;
  const machine = machines.find((m) => m.slug === slug);
  if (!machine) notFound();

  const currentIndex = machines.indexOf(machine);
  const prevMachine = currentIndex > 0 ? machines[currentIndex - 1] : null;
  const nextMachine = currentIndex < machines.length - 1 ? machines[currentIndex + 1] : null;

  return (
    <>
      <HeaderWrapper solid />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-navy pt-28 pb-16 lg:pt-40 lg:pb-24">
          <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy-light to-cyan/20" />
          <div className="relative z-10 mx-auto max-w-6xl px-6">
            <Link
              href="/#tecnologia"
              className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors focus-visible:text-white"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden />
              Nuestra tecnología
            </Link>

            <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 items-center">
              {/* Text */}
              <div>
                <p className="font-stats text-[13px] font-medium tracking-widest uppercase text-teal mb-5 animate-fade-up">
                  Tecnología Phyresport
                </p>
                <h1 className="font-display text-[clamp(2rem,5vw,3.75rem)] font-extrabold leading-[1.05] tracking-tight text-white mb-6 animate-fade-up-delay-1">
                  {machine.name}
                </h1>
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
                  {machine.image ? (
                    <Image
                      src={machine.image}
                      alt={machine.name}
                      fill
                      className="object-contain"
                      priority
                      sizes="(min-width: 1024px) 560px, 100vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-teal/70">
                      Imagen próximamente
                    </div>
                  )}
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
              <div className="max-w-3xl mb-12 lg:mb-16">
                <div aria-hidden className="h-[3px] w-10 bg-teal mb-6" />
                <p className="text-xl lg:text-2xl text-gray-500 leading-relaxed">
                  {machine.text}
                </p>
              </div>
            </ScrollReveal>

            {/* Highlights */}
            {machine.highlights.length > 0 && (
              <ScrollReveal delay={80}>
                <div className="rounded-2xl border border-gray-100 bg-ice/60 p-8 lg:p-10">
                  <h2 className="font-stats text-xs font-semibold text-teal uppercase tracking-[0.2em] mb-6">
                    Características clave
                  </h2>
                  <ul className="grid gap-4 sm:grid-cols-2">
                    {machine.highlights.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-navy">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal/15 text-teal">
                          <Check className="h-3.5 w-3.5" aria-hidden />
                        </span>
                        <span className="text-[15px] leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </ScrollReveal>
            )}

            {/* CTA band */}
            <ScrollReveal delay={120}>
              <div className="relative mt-16 lg:mt-24 overflow-hidden rounded-2xl bg-navy px-8 py-12 lg:px-16 lg:py-16 text-center">
                <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy-light to-cyan/20" />
                <div className="relative z-10 max-w-xl mx-auto">
                  <h2 className="font-display text-2xl lg:text-3xl font-bold text-white mb-3">
                    ¿Quieres saber si esta tecnología es para ti?
                  </h2>
                  <p className="text-white/70 leading-relaxed mb-8">
                    Empezamos con una valoración personalizada y diseñamos el plan de tratamiento
                    que mejor se adapta a tu caso.
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
              aria-label="Otra tecnología"
            >
              {prevMachine ? (
                <Link
                  href={`/tecnologia/${prevMachine.slug}`}
                  className="group flex items-center gap-3 min-w-0"
                >
                  <ArrowLeft className="w-4 h-4 text-gray-300 group-hover:text-teal shrink-0" aria-hidden />
                  <span className="min-w-0">
                    <span className="block font-stats text-[11px] uppercase tracking-widest text-gray-400">
                      Anterior
                    </span>
                    <span className="block font-display font-bold text-navy truncate group-hover:text-teal transition-colors">
                      {prevMachine.name}
                    </span>
                  </span>
                </Link>
              ) : (
                <div />
              )}
              {nextMachine ? (
                <Link
                  href={`/tecnologia/${nextMachine.slug}`}
                  className="group flex items-center gap-3 text-right min-w-0"
                >
                  <span className="min-w-0">
                    <span className="block font-stats text-[11px] uppercase tracking-widest text-gray-400">
                      Siguiente
                    </span>
                    <span className="block font-display font-bold text-navy truncate group-hover:text-teal transition-colors">
                      {nextMachine.name}
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
