import Image from "next/image";
import Link from "next/link";
import { courses } from "@/lib/data";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { ArrowRight } from "lucide-react";

export function CoursesSection() {
  return (
    <section className="py-24 lg:py-28 bg-ice" id="cursos">
      <div className="mx-auto max-w-7xl px-6">
        <ScrollReveal>
          <div className="text-center mb-16">
            <p className="font-stats text-[13px] font-medium tracking-widest uppercase text-teal mb-3">
              Formación
            </p>
            <h2 className="font-display text-[clamp(1.75rem,3.5vw,2.75rem)] font-bold leading-tight tracking-tight text-charcoal mb-4">
              Próximos cursos
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Formación especializada para fisioterapeutas. Cursos bonificables a través de
              BonificaTuCurso.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {courses.map((course, i) => (
            <ScrollReveal key={course.slug} delay={i * 100}>
              <div className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1 transition-all grid grid-cols-1 sm:grid-cols-[200px_1fr]">
                <Image
                  src={course.image}
                  alt={`${course.title} — ${course.date}`}
                  width={200}
                  height={200}
                  className="w-full h-48 sm:h-full object-cover"
                  loading="lazy"
                />
                <div className="p-7 flex flex-col justify-center">
                  <p className="font-stats text-xs font-medium text-teal uppercase tracking-wider mb-2">
                    {course.date}
                  </p>
                  <h3 className="font-display text-xl font-bold text-navy mb-3 leading-tight">
                    {course.title}
                  </h3>
                  <p className="text-[15px] text-gray-500 leading-relaxed mb-4">
                    {course.description}
                  </p>
                  <Link
                    href={`/cursos/${course.slug}`}
                    className="inline-flex items-center gap-2 font-display font-semibold text-teal hover:text-cyan transition-colors group/link"
                  >
                    Más información
                    <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
