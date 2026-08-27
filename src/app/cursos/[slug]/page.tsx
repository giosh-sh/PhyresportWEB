import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { courses, siteConfig } from "@/lib/data";
import HeaderWrapper from "@/components/layout/header-wrapper";
import { Footer } from "@/components/layout/footer";
import { WhatsAppFloat } from "@/components/ui/whatsapp-float";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { ArrowLeft, FileText, ArrowRight } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return courses.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const course = courses.find((c) => c.slug === slug);
  if (!course) return {};
  return {
    title: course.title,
    description: course.description,
  };
}

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params;
  const course = courses.find((c) => c.slug === slug);
  if (!course) notFound();

  return (
    <>
      <HeaderWrapper />
      <main>
        {/* Hero */}
        <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-20 bg-navy overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src={course.imageFull}
              alt=""
              fill
              className="object-cover opacity-10"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-navy/90 to-navy" />
          </div>
          <div className="relative z-10 mx-auto max-w-4xl px-6">
            <Link
              href="/cursos"
              className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a cursos
            </Link>
            <p className="font-stats text-[13px] font-medium tracking-widest uppercase text-teal mb-3">
              {course.date}
            </p>
            <h1 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-extrabold leading-tight tracking-tight text-white">
              {course.title}
            </h1>
          </div>
        </section>

        {/* Content */}
        <section className="py-16 lg:py-20">
          <div className="mx-auto max-w-3xl px-6">
            <ScrollReveal>
              <Image
                src={course.imageFull}
                alt={`${course.title} — ${course.date}`}
                width={800}
                height={500}
                className="w-full h-auto rounded-xl shadow-lg mb-10"
                loading="lazy"
              />
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <p className="text-lg text-gray-500 leading-relaxed mb-8">
                {course.description}
              </p>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div className="flex flex-wrap gap-4 mb-10">
                <a
                  href={course.programPdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-ice text-navy font-display font-semibold text-sm rounded-full hover:bg-teal hover:text-white transition-all"
                >
                  <FileText className="w-4 h-4" />
                  Descargar programa completo
                </a>
                <a
                  href={siteConfig.whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-teal text-white font-display font-semibold text-sm rounded-full hover:bg-cyan transition-all"
                >
                  Inscribirse por WhatsApp
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </ScrollReveal>

            {/* BonificaTuCurso */}
            <ScrollReveal delay={300}>
              <div className="bg-ice rounded-xl p-8 text-center">
                <a
                  href={siteConfig.bonificaTuCurso}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mb-3"
                >
                  <Image
                    src="https://www.phyresport.com/images/Logos/LogoBonificaTuCurso.png"
                    alt="Bonifica tu curso"
                    width={200}
                    height={60}
                    className="h-12 w-auto mx-auto"
                    loading="lazy"
                  />
                </a>
                <p className="text-sm text-gray-500">
                  Este curso es bonificable. BonificaTuCurso gestiona las bonificaciones de los
                  cursos de Phyresport.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
