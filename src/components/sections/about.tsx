import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createPublicClient } from "@/lib/supabase/public";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { AboutSlider, type AboutSlide } from "@/components/sections/about-slider";

const DEFAULT_IMAGES: AboutSlide[] = [
  {
    id: "default",
    image:
      "https://www.phyresport.com/images/sampledata/asimage/home/home.jpg",
    title: "Instalaciones de Phyresport en Santa Cruz de Tenerife",
  },
];

export default async function AboutSection() {
  let slides: AboutSlide[] = [];
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("slider_images")
      .select("id, title, image_url")
      .eq("active", true)
      .order("sort_order", { ascending: true });
    if (data) {
      slides = (data as { id: string; title: string | null; image_url: string | null }[])
        .filter((b) => b.image_url)
        .map((b) => ({ id: b.id, image: b.image_url as string, title: b.title ?? undefined }));
    }
  } catch {
    // DB sin configurar en local: usar imágenes por defecto
  }
  if (slides.length === 0) slides = DEFAULT_IMAGES;

  return (
    <section className="py-24 lg:py-28" id="nosotros">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Image slider */}
          <ScrollReveal>
            <div className="relative">
              <AboutSlider slides={slides} />
              <div className="absolute -bottom-4 lg:-bottom-6 right-4 lg:right-[-24px] bg-white rounded-xl p-5 shadow-xl max-w-[240px] border-l-4 border-teal">
                <p className="font-display text-base font-bold text-navy mb-1">
                  EPI® Ecoguiada
                </p>
                <p className="text-xs text-gray-500">
                  Técnica pionera en Canarias para tratamiento de tendinopatías
                </p>
              </div>
            </div>
          </ScrollReveal>

          {/* Text */}
          <ScrollReveal delay={150}>
            <p className="font-stats text-[13px] font-medium tracking-widest uppercase text-teal mb-3">
              Sobre nosotros
            </p>
            <h2 className="font-display text-[clamp(1.75rem,3.5vw,2.75rem)] font-bold leading-tight tracking-tight text-charcoal mb-5">
              Centro de fisioterapia deportiva en Tenerife
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed mb-4">
              En Phyresport combinamos experiencia clínica con técnicas de vanguardia. Nuestro
              equipo de fisioterapeutas especializados trabaja con deportistas profesionales y
              personas activas que buscan recuperación de calidad.
            </p>
            <p className="text-lg text-gray-500 leading-relaxed mb-8">
              Desde la técnica EPI® Ecoguiada hasta la osteopatía y la terapia manual fascial,
              cada tratamiento se diseña en función de tu diagnóstico y tus objetivos.
            </p>
            <Link
              href="/servicios/fisioterapia"
              className="inline-flex items-center gap-2 font-display font-semibold text-teal hover:text-cyan transition-colors group"
            >
              Conocer nuestros servicios
              <ArrowRight className="w-[18px] h-[18px] group-hover:translate-x-1 transition-transform" />
            </Link>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
