import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { team, siteConfig } from "@/lib/data";
import HeaderWrapper from "@/components/layout/header-wrapper";
import { Footer } from "@/components/layout/footer";
import { WhatsAppFloat } from "@/components/ui/whatsapp-float";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { ArrowLeft, ArrowRight, Phone } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return team.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const member = team.find((m) => m.slug === slug);
  if (!member) return {};
  return {
    title: member.fullName,
    description: member.description,
  };
}

export default async function TeamMemberPage({ params }: Props) {
  const { slug } = await params;
  const member = team.find((m) => m.slug === slug);
  if (!member) notFound();

  const idx = team.findIndex((m) => m.slug === slug);
  const prev = idx > 0 ? team[idx - 1] : null;
  const next = idx < team.length - 1 ? team[idx + 1] : null;

  const phoneHref = member.phone?.replace(/\s/g, "");
  const whatsappHref = member.phone ? `https://wa.me/34${phoneHref}` : siteConfig.whatsappHref;

  return (
    <>
      <HeaderWrapper solid />
      <main>
        {/* Dossier */}
        <section className="pt-28 pb-16 lg:pt-36 lg:pb-24 bg-white border-b border-gray-100">
          <div className="mx-auto max-w-6xl px-6">
            <Link
              href="/equipo"
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-teal mb-10 transition-colors focus-visible:text-teal"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden />
              Nuestro equipo
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,380px)_1fr] gap-10 lg:gap-16 items-start">
              {/* Portrait */}
              <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-ice shadow-sm">
                <Image
                  src={member.image}
                  alt={member.fullName}
                  fill
                  className="object-cover object-top"
                  priority
                  sizes="(min-width: 1024px) 380px, 100vw"
                />
                <span aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-teal/70" />
              </div>

              {/* Info */}
              <div className="lg:pt-4">
                <p className="font-stats text-xs font-semibold text-teal uppercase tracking-[0.2em] mb-3">
                  {member.role}
                </p>
                <h1 className="font-display text-[clamp(2rem,4.5vw,3.25rem)] font-extrabold leading-[1.05] tracking-tight text-navy mb-5">
                  {member.fullName}
                </h1>
                <div aria-hidden className="h-[3px] w-24 bg-teal mb-8" />
                <p className="text-lg text-gray-500 leading-relaxed mb-10 max-w-xl">
                  {member.description}
                </p>

                <div className="flex flex-wrap gap-4">
                  {member.phone && (
                    <a
                      href={`tel:${phoneHref}`}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-teal text-white font-display font-semibold text-sm rounded-full hover:bg-cyan transition-all hover:-translate-y-0.5"
                    >
                      <Phone className="w-4 h-4" aria-hidden />
                      Llamar · {member.phone}
                    </a>
                  )}
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 border border-gray-200 text-navy font-display font-semibold text-sm rounded-full hover:border-teal hover:text-teal transition-all"
                  >
                    Pedir cita por WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Credentials / First visit */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-6xl px-6">
            {member.credentials.length > 0 ? (
              <ScrollReveal>
                <div className="max-w-3xl">
                  <h2 className="font-stats text-xs font-semibold text-teal uppercase tracking-[0.2em] mb-6">
                    Formación y credenciales
                  </h2>
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {member.credentials.map((cred, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 rounded-lg border border-gray-100 bg-ice/60 px-5 py-4 text-gray-600 text-[15px] leading-snug"
                      >
                        <span className="mt-2 w-1.5 h-1.5 rounded-full bg-teal shrink-0" aria-hidden />
                        {cred}
                      </li>
                    ))}
                  </ul>
                </div>
              </ScrollReveal>
            ) : (
              <ScrollReveal>
                <div className="max-w-3xl rounded-xl border border-dashed border-gray-200 bg-ice/40 px-8 py-10">
                  <h2 className="font-display text-xl font-bold text-navy mb-2">
                    Tu primera valoración
                  </h2>
                  <p className="text-gray-500 leading-relaxed">
                    Pide cita con {member.name} para una valoración personalizada. Analizamos tu
                    caso, marcamos objetivos y diseñamos un plan de tratamiento a tu medida.
                  </p>
                </div>
              </ScrollReveal>
            )}

            {/* Prev / Next */}
            <nav
              className="mt-16 lg:mt-24 pt-8 border-t border-gray-200 flex justify-between gap-6"
              aria-label="Navegación entre especialistas"
            >
              {prev ? (
                <Link href={`/equipo/${prev.slug}`} className="group flex items-center gap-3 min-w-0">
                  <ArrowLeft className="w-4 h-4 text-gray-300 group-hover:text-teal shrink-0" aria-hidden />
                  <span className="min-w-0">
                    <span className="block font-stats text-[11px] uppercase tracking-widest text-gray-400">
                      Anterior
                    </span>
                    <span className="block font-display font-bold text-navy truncate group-hover:text-teal transition-colors">
                      {prev.name}
                    </span>
                  </span>
                </Link>
              ) : (
                <div />
              )}
              {next ? (
                <Link href={`/equipo/${next.slug}`} className="group flex items-center gap-3 text-right min-w-0">
                  <span className="min-w-0">
                    <span className="block font-stats text-[11px] uppercase tracking-widest text-gray-400">
                      Siguiente
                    </span>
                    <span className="block font-display font-bold text-navy truncate group-hover:text-teal transition-colors">
                      {next.name}
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