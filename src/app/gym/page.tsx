import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, Dumbbell, HeartPulse, Target, Users } from "lucide-react";
import { gymPhotos, gymVideo, siteConfig } from "@/lib/data";
import HeaderWrapper from "@/components/layout/header-wrapper";
import { Footer } from "@/components/layout/footer";
import { WhatsAppFloat } from "@/components/ui/whatsapp-float";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export const metadata: Metadata = {
  title: "Gym y Readaptación",
  description:
    "Zona de gym y readaptación de lesiones deportivas de Phyresport en Santa Cruz de Tenerife, dirigida por María Pinto (CAFYD).",
};

const features = [
  {
    icon: Target,
    title: "Valoración funcional",
    text: "Analizamos tu punto de partida para diseñar un plan realista y adaptado a tus objetivos.",
  },
  {
    icon: Dumbbell,
    title: "Entrenamiento guiado",
    text: "Trabajo de fuerza, movilidad y control motor con supervisión de nuestra especialista.",
  },
  {
    icon: HeartPulse,
    title: "Readaptación de lesiones",
    text: "Progresión desde la recuperación hasta el retorno seguro al deporte y a tu día a día.",
  },
  {
    icon: Users,
    title: "Acompañamiento",
    text: "Seguimiento continuo y coordinación con el resto del equipo de fisioterapia.",
  },
];

export default function GymPage() {
  return (
    <>
      <HeaderWrapper solid />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-navy pt-28 pb-16 lg:pt-40 lg:pb-24">
          <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy-light to-cyan/20" />
          <div className="relative z-10 mx-auto max-w-6xl px-6">
            <Link
              href="/#gym"
              className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors focus-visible:text-white"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden />
              Volver al inicio
            </Link>

            <div className="mt-10 max-w-3xl">
              <p className="font-stats text-[13px] font-medium tracking-widest uppercase text-teal mb-5 animate-fade-up">
                Gym
              </p>
              <h1 className="font-display text-[clamp(2rem,5vw,3.75rem)] font-extrabold leading-[1.05] tracking-tight text-white mb-6 animate-fade-up-delay-1">
                Gym y Readaptación de Lesiones Deportivas
              </h1>
              <p className="text-lg text-white/70 leading-relaxed mb-4 animate-fade-up-delay-2">
                Dirigido por nuestra especialista CAFYD María Pinto. Un espacio pensado para
                recuperar tu movimiento, mejorar tu rendimiento y volver a la actividad con
                seguridad.
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-fade-up-delay-3">
                <a
                  href={siteConfig.whatsappBookingHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-teal text-white font-display font-semibold text-sm rounded-full hover:bg-cyan hover:-translate-y-0.5 transition-all"
                >
                  Reservar valoración
                  <ArrowRight className="w-4 h-4" aria-hidden />
                </a>
                <a
                  href={siteConfig.phoneHref}
                  className="inline-flex items-center gap-2 px-6 py-3 border border-white/30 text-white font-display font-semibold text-sm rounded-full hover:border-white hover:bg-white/10 transition-all"
                >
                  Llamar · {siteConfig.phone}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Intro + features */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <ScrollReveal>
              <div className="max-w-2xl mb-12 lg:mb-16">
                <div aria-hidden className="h-[3px] w-10 bg-teal mb-6" />
                <p className="text-xl lg:text-2xl text-gray-500 leading-relaxed">
                  En nuestra zona de gym combinamos entrenamiento y fisioterapia para acompañarte
                  desde la lesión hasta el máximo rendimiento. Cada plan se adapta a tu caso,
                  respetando tus tiempos y marcando objetivos medibles.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <ScrollReveal key={feature.title} delay={i * 80} className="h-full">
                    <div className="h-full rounded-2xl border border-gray-100 bg-white p-7 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                      <div className="w-12 h-12 rounded-lg bg-ice flex items-center justify-center text-teal mb-5">
                        <Icon className="w-6 h-6 stroke-[1.5]" aria-hidden />
                      </div>
                      <h2 className="font-display text-lg font-bold text-navy mb-2.5">
                        {feature.title}
                      </h2>
                      <p className="text-[15px] text-gray-500 leading-relaxed">{feature.text}</p>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* Video */}
        <section className="py-16 lg:py-24 bg-ice" id="video">
          <div className="mx-auto max-w-5xl px-6">
            <ScrollReveal>
              <div className="text-center mb-10">
                <p className="font-stats text-[13px] font-medium tracking-widest uppercase text-teal mb-3">
                  Vídeo
                </p>
                <h2 className="font-display text-[clamp(1.75rem,3.5vw,2.5rem)] font-bold leading-tight tracking-tight text-charcoal">
                  Conoce nuestra zona de gym
                </h2>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <div className="relative overflow-hidden rounded-2xl bg-navy shadow-[0_24px_80px_rgba(0,0,0,0.25)]">
                <video
                  className="w-full h-auto aspect-video"
                  controls
                  playsInline
                  preload="metadata"
                  poster={gymPhotos[1] ?? gymPhotos[0]}
                >
                  <source src={gymVideo} type="video/mp4" />
                  Tu navegador no soporta la reproducción de vídeo.
                </video>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Gallery */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <ScrollReveal>
              <div className="text-center mb-12">
                <p className="font-stats text-[13px] font-medium tracking-widest uppercase text-teal mb-3">
                  Galería
                </p>
                <h2 className="font-display text-[clamp(1.75rem,3.5vw,2.5rem)] font-bold leading-tight tracking-tight text-charcoal mb-4">
                  Nuestras instalaciones
                </h2>
                <p className="text-lg text-gray-500 max-w-xl mx-auto">
                  Un espacio equipado y luminoso pensado para tu recuperación y entrenamiento.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {gymPhotos.map((photo, i) => (
                <ScrollReveal key={photo} delay={(i % 4) * 60}>
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-ice shadow-sm ring-1 ring-gray-100">
                    <Image
                      src={photo}
                      alt={`Instalaciones de gym y readaptación de Phyresport ${i + 1}`}
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                      className="object-cover hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative py-20 lg:py-24 bg-gradient-to-br from-navy via-navy-light to-cyan/40 overflow-hidden">
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-teal/[0.07] blur-3xl" />
          <div className="relative z-10 mx-auto max-w-2xl px-6 text-center">
            <h2 className="font-display text-[clamp(1.75rem,3.5vw,2.75rem)] font-bold leading-tight text-white mb-4">
              Empieza tu readaptación
            </h2>
            <p className="text-lg text-white/70 mb-8 max-w-md mx-auto">
              Reserva tu valoración y descubre cómo podemos ayudarte a volver a moverte sin límites.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a
                href={siteConfig.whatsappBookingHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-teal text-white font-display font-semibold text-[15px] rounded-full shadow-[0_4px_24px_rgba(0,184,212,0.3)] hover:bg-cyan hover:-translate-y-0.5 transition-all"
              >
                Reservar valoración
              </a>
              <a
                href={siteConfig.phoneHref}
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 border border-white/30 text-white font-display font-semibold text-[15px] rounded-full hover:border-white hover:bg-white/8 transition-all"
              >
                Llamar: {siteConfig.phone}
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
