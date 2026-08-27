import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { team, siteConfig } from "@/lib/data";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppFloat } from "@/components/ui/whatsapp-float";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { ArrowLeft, Phone } from "lucide-react";

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

  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-20 bg-navy">
          <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio
            </Link>
            <div className="w-[160px] h-[160px] mx-auto mb-6">
              <Image
                src={member.image}
                alt={member.fullName}
                width={160}
                height={160}
                className="w-[160px] h-[160px] rounded-full object-cover object-top border-4 border-teal/30"
              />
            </div>
            <h1 className="font-display text-3xl lg:text-4xl font-extrabold text-white mb-2">
              {member.fullName}
            </h1>
            <p className="font-stats text-sm font-medium text-teal uppercase tracking-wider">
              {member.role}
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="py-16 lg:py-20">
          <div className="mx-auto max-w-2xl px-6">
            <ScrollReveal>
              <p className="text-lg text-gray-500 leading-relaxed mb-8 text-center">
                {member.description}
              </p>
            </ScrollReveal>

            {member.credentials.length > 0 && (
              <ScrollReveal delay={100}>
                <div className="bg-ice rounded-xl p-8 mb-8">
                  <h2 className="font-display text-lg font-bold text-navy mb-4">
                    Formación y credenciales
                  </h2>
                  <ul className="space-y-2">
                    {member.credentials.map((cred, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal mt-2 shrink-0" />
                        {cred}
                      </li>
                    ))}
                  </ul>
                </div>
              </ScrollReveal>
            )}

            {member.phone && (
              <ScrollReveal delay={200}>
                <div className="text-center">
                  <a
                    href={`tel:${member.phone.replace(/\s/g, "")}`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-teal text-white font-display font-semibold rounded-full hover:bg-cyan transition-all"
                  >
                    <Phone className="w-4 h-4" />
                    {member.phone}
                  </a>
                </div>
              </ScrollReveal>
            )}
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
