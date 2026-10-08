import Image from "next/image";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { ReadMore } from "@/components/ui/read-more";
import { Cpu } from "lucide-react";

interface Machine {
  name: string;
  image: string | null;
  text: string;
}

const machines: Machine[] = [
  {
    name: "SIMAI",
    image: "/img/simai.jpeg",
    text: "SIMAI es una tecnología avanzada basada en campos electromagnéticos de alta intensidad, capaz de actuar de forma profunda sobre el sistema neuromuscular. Permite trabajar el dolor, la activación y recuperación muscular y la función neuromotora, complementando nuestros tratamientos de fisioterapia avanzada.",
  },
  {
    name: "K-Laser Cube Plus 30",
    image: "/img/k-laser-cube-plus-30.jpeg",
    text: "K-Laser Cube Plus 30 es un sistema de láser terapéutico de alta potencia diseñado para actuar de forma profunda y precisa sobre los tejidos. Su aplicación se integra en el tratamiento del dolor, procesos inflamatorios, lesiones musculares y tendinosas y recuperación funcional, favoreciendo la respuesta biológica y la recuperación de los tejidos. Una tecnología avanzada, no invasiva y adaptable a las necesidades de cada paciente.",
  },
  {
    name: "Impactis M",
    image: "/img/impactis-m.jpeg",
    text: "Impactis M es un sistema de ondas de choque radiales utilizado en fisioterapia avanzada para el tratamiento de diferentes dolores y lesiones musculoesqueléticas, especialmente en tendones, músculos y tejidos blandos. Su aplicación mediante ondas mecánicas de alta energía permite estimular los tejidos, mejorar la respuesta local y favorecer los procesos de recuperación, integrándose en tratamientos personalizados según las necesidades de cada paciente.",
  },
  {
    name: "Doctor Tecar Plus",
    image: "/img/doctor-tecar-plus.jpeg",
    text: "Doctor Tecar Plus es un sistema de diatermia capacitiva y resistiva que utiliza radiofrecuencia para generar un efecto térmico profundo y controlado en los tejidos. Se integra en el tratamiento del dolor, lesiones musculares y tendinosas y procesos de recuperación funcional, favoreciendo la circulación y la respuesta fisiológica de los tejidos. Una tecnología avanzada que permite personalizar la intensidad y profundidad del tratamiento según las necesidades de cada paciente.",
  },
  {
    name: "Descompresión Muscular",
    image: "/img/muscle-descompresion.jpeg",
    text: "El dispositivo de Descompresión Muscular para un tratamiento muscular preciso y profundo. Combina tracción y descompresión controlada del tejido para liberar tensiones, mejorar la circulación y favorecer la recuperación muscular.",
  },
];

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
            <ScrollReveal key={machine.name} delay={i * 80} className="h-full">
              <article className="h-full flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all">
                {/* Image / placeholder */}
                <div className="relative aspect-[4/3] bg-white flex items-center justify-center">
                  {machine.image ? (
                    <Image
                      src={machine.image}
                      alt={machine.name}
                      fill
                      sizes="(min-width: 1024px) 20vw, 50vw"
                      className="object-contain p-2 sm:p-4"
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
                  <ReadMore
                    text={machine.text}
                    className="flex-1"
                    textClassName="text-[13px] sm:text-[15px]"
                  />
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
