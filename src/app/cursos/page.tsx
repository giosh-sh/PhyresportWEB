import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { siteConfig } from "@/lib/data";
import { getPublicCourses } from "@/lib/courses";
import HeaderWrapper from "@/components/layout/header-wrapper";
import { Footer } from "@/components/layout/footer";
import { WhatsAppFloat } from "@/components/ui/whatsapp-float";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { ArrowRight, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Cursos de Formación",
  description:
    "Formación especializada en EPI y técnicas avanzadas de fisioterapia para profesionales. Cursos bonificables.",
};

export default async function CursosPage() {
  const courses = await getPublicCourses();

  return (
    <>
      <HeaderWrapper />
      <main>
        {/* Hero */}
        <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-20 bg-navy">
          <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
            <p className="font-stats text-[13px] font-medium tracking-widest uppercase text-teal mb-3">
              Formación
            </p>
            <h1 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-extrabold leading-tight tracking-tight text-white mb-4">
              Cursos de Formación
            </h1>
            <p className="text-lg text-white/70 max-w-xl mx-auto">
              Formación especializada para fisioterapeutas. Cursos bonificables a través de
              BonificaTuCurso.
            </p>
          </div>
        </section>

        {/* Courses */}
        <section className="py-16 lg:py-20">
          <div className="mx-auto max-w-4xl px-6 space-y-10">
            {courses.length === 0 && (
              <p className="text-center text-gray-500">
                No hay cursos disponibles en este momento.
              </p>
            )}

            {courses.map((course, i) => (
              <ScrollReveal key={course.slug} delay={i * 100}>
                <div className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100">
                  <Link href={`/cursos/${course.slug}`} className="group block">
                    <Image
                      src={course.image_full_url || course.image_url}
                      alt={`${course.title} — ${course.date}`}
                      width={800}
                      height={400}
                      className="w-full h-auto object-cover group-hover:opacity-95 transition-opacity"
                      loading="lazy"
                    />
                  </Link>
                  <div className="p-8">
                    <p className="font-stats text-xs font-medium text-teal uppercase tracking-wider mb-2">
                      {course.date}
                    </p>
                    <h2 className="font-display text-2xl font-bold text-navy mb-3">
                      <Link href={`/cursos/${course.slug}`} className="hover:text-teal transition-colors">
                        {course.title}
                      </Link>
                    </h2>
                    <p className="text-gray-500 leading-relaxed mb-6">{course.description}</p>
                    <div className="flex flex-wrap gap-4">
                      <a
                        href={course.program_pdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-ice text-navy font-display font-semibold text-sm rounded-full hover:bg-teal hover:text-white transition-all"
                      >
                        <FileText className="w-4 h-4" />
                        Descargar programa
                      </a>
                      <Link
                        href={`/cursos/${course.slug}#inscripcion`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal text-white font-display font-semibold text-sm rounded-full hover:bg-cyan transition-all"
                      >
                        Inscribirse
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}

            {/* BonificaTuCurso */}
            <ScrollReveal delay={200}>
              <div className="text-center pt-8">
                <a
                  href={siteConfig.bonificaTuCurso}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <Image
                    src="https://www.phyresport.com/images/Logos/LogoBonificaTuCurso.png"
                    alt="Bonifica tu curso"
                    width={200}
                    height={60}
                    className="h-12 w-auto mx-auto opacity-70 hover:opacity-100 transition-opacity"
                    loading="lazy"
                  />
                </a>
                <p className="mt-3 text-sm text-gray-400">
                  Gestiona las bonificaciones de los cursos de Phyresport
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
