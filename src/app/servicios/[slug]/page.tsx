import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { services, siteConfig } from "@/lib/data";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppFloat } from "@/components/ui/whatsapp-float";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

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

  const currentIndex = services.indexOf(service);
  const prevService = currentIndex > 0 ? services[currentIndex - 1] : null;
  const nextService = currentIndex < services.length - 1 ? services[currentIndex + 1] : null;

  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-20 bg-navy overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src={service.image}
              alt=""
              fill
              className="object-cover opacity-10"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-navy/90 to-navy" />
          </div>
          <div className="relative z-10 mx-auto max-w-4xl px-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio
            </Link>
            <p className="font-stats text-[13px] font-medium tracking-widest uppercase text-teal mb-3">
              {service.eyebrow}
            </p>
            <h1 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-extrabold leading-tight tracking-tight text-white">
              {service.title}
            </h1>
          </div>
        </section>

        {/* Content */}
        <section className="py-16 lg:py-20">
          <div className="mx-auto max-w-4xl px-6">
            <ScrollReveal>
              <p className="text-lg text-gray-500 leading-relaxed mb-10 text-center max-w-2xl mx-auto">
                {service.content.intro}
              </p>
            </ScrollReveal>

            {/* Service image */}
            <ScrollReveal>
              <div className="mb-12 flex justify-center">
                <Image
                  src={service.image}
                  alt={service.title}
                  width={600}
                  height={400}
                  className="rounded-xl shadow-lg max-w-full h-auto"
                  loading="lazy"
                />
              </div>
            </ScrollReveal>

            {/* Sections */}
            <div className="space-y-10">
              {service.content.sections.map((section, i) => (
                <ScrollReveal key={i} delay={i * 100}>
                  <div className="border-l-[3px] border-teal pl-6 lg:pl-8">
                    <h2 className="font-display text-xl lg:text-2xl font-bold text-navy mb-3">
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
                <p className="mt-10 text-sm text-gray-400 italic text-center">
                  Fuente: {service.source}
                </p>
              </ScrollReveal>
            )}

            {/* Navigation */}
            <div className="mt-16 pt-8 border-t border-gray-200 flex justify-between">
              {prevService ? (
                <Link
                  href={`/servicios/${prevService.slug}`}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-teal transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {prevService.shortTitle}
                </Link>
              ) : (
                <div />
              )}
              {nextService ? (
                <Link
                  href={`/servicios/${nextService.slug}`}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-teal transition-colors"
                >
                  {nextService.shortTitle}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <div />
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
