import Image from "next/image";
import Link from "next/link";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { machines } from "@/lib/data";
import { ArrowRight, Cpu } from "lucide-react";

export function TechnologySection() {
  return (
    <section className="py-24 lg:py-28 bg-white" id="tecnologia">
      <div className="mx-auto max-w-7xl px-6">
        <ScrollReveal>
          <div className="text-center mb-16">
            <p className="font-stats text-[13px] font-medium tracking-widest uppercase text-teal mb-3">
              Tecnología
            </p>
            <h2 className="font-display text-[clamp(1.75rem,3.5vw,2.75rem)] font-bold leading-tight tracking-tight text-charcoal mb-4">
              Nuestra tecnología
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Dispositivos de alta tecnología que nos permiten ofrecer un tratamiento preciso,
              profundo y adaptado a cada paciente.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-6">
          {machines.map((machine, i) => (
            <ScrollReveal key={machine.slug} delay={i * 80} className="h-full">
              <Link
                href={`/tecnologia/${machine.slug}`}
                className="group h-full flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all"
              >
                {/* Image / placeholder */}
                <div className="relative aspect-[4/3] bg-white flex items-center justify-center">
                  {machine.image ? (
                    <Image
                      src={machine.image}
                      alt={machine.name}
                      fill
                      sizes="(min-width: 1024px) 20vw, 50vw"
                      className="object-contain p-2 sm:p-4 group-hover:scale-[1.03] transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-teal/70">
                      <Cpu className="w-8 h-8" aria-hidden />
                      <span className="font-stats text-[10px] uppercase tracking-widest">
                        Imagen próximamente
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 p-4 sm:p-6">
                  <h3 className="font-display text-sm sm:text-lg font-bold text-navy mb-2 sm:mb-3">
                    {machine.name}
                  </h3>
                  <p className="text-[13px] sm:text-[15px] text-gray-500 leading-relaxed line-clamp-3 flex-1">
                    {machine.text}
                  </p>
                  <span className="mt-2 sm:mt-3 inline-flex items-center gap-1.5 font-display text-[13px] sm:text-sm font-semibold text-teal group-hover:gap-2.5 transition-all">
                    Leer más
                    <ArrowRight className="w-4 h-4" aria-hidden />
                  </span>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
