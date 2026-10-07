import Image from "next/image";
import Link from "next/link";
import { siteConfig, team } from "@/lib/data";
import { ArrowRight } from "lucide-react";
import { createPublicClient } from "@/lib/supabase/public";

const stats = [
  { number: "+15", label: "Años de experiencia" },
  { number: "+5.000", label: "Tratamientos realizados" },
  { number: "7", label: "Especialistas" },
];

const DEFAULT_BG = "https://www.phyresport.com/images/sampledata/asimage/home/home.jpg";

async function getHeroBackground(): Promise<string> {
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("banners")
      .select("id, image_url")
      .eq("active", true)
      .not("image_url", "is", null)
      .order("sort_order", { ascending: true })
      .limit(1);
    const url = (data?.[0]?.image_url as string) ?? "";
    return url || DEFAULT_BG;
  } catch {
    return DEFAULT_BG;
  }
}

export async function HeroSection() {
  const bg = await getHeroBackground();

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-navy" id="inicio">
      {/* Background */}
      <div className="absolute inset-0">
        <Image
          src={bg}
          alt=""
          fill
          className="object-cover opacity-15 saturate-[0.3]"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-navy/95 via-navy/80 to-cyan/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-28 lg:py-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text */}
          <div>
            <p className="font-display text-xl lg:text-2xl font-extrabold tracking-[0.35em] uppercase text-white mb-5 animate-fade-up">
              Phyresport
            </p>

            <p className="font-stats text-[13px] font-medium tracking-widest uppercase text-teal mb-5 animate-fade-up-delay-1">
              Fisioterapia deportiva de precisión
            </p>

            <h1 className="font-display text-[clamp(2.5rem,6vw,4.5rem)] font-extrabold leading-[1.08] tracking-tight text-white mb-6 animate-fade-up-delay-2">
              Tu{" "}
              <span className="relative inline-block">
                movimiento
                <span className="absolute bottom-1 left-0 h-1.5 bg-gradient-to-r from-teal to-cyan rounded-sm animate-underline-sweep" />
              </span>
              .<br />
              Nuestra{" "}
              <span className="relative inline-block">
                misión
                <span className="absolute bottom-1 left-0 h-1.5 bg-gradient-to-r from-teal to-cyan rounded-sm animate-underline-sweep" />
              </span>
              .
            </h1>

            <p className="text-lg text-white/70 max-w-lg mb-9 animate-fade-up-delay-3">
              Rehabilitación, osteopatía y rendimiento deportivo en Santa Cruz de Tenerife.
              Recupera tu movimiento con la técnica EPI® Ecoguiada y un equipo que entiende tu
              cuerpo.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-12 animate-fade-up-delay-4">
              <a
                href={siteConfig.whatsappBookingHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-teal text-white font-display font-semibold text-[15px] rounded-full shadow-[0_4px_24px_rgba(0,184,212,0.3)] hover:bg-cyan hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,184,212,0.4)] transition-all"
              >
                Reservar valoración
                <ArrowRight className="w-[18px] h-[18px]" />
              </a>
              <Link
                href="/servicios/fisioterapia"
                className="inline-flex items-center gap-2 px-7 py-3.5 border border-white/30 text-white font-display font-semibold text-[15px] rounded-full hover:border-white hover:bg-white/8 transition-all"
              >
                Ver servicios
              </Link>
            </div>
          </div>

          {/* Stats + Team cluster */}
          <div className="flex flex-col items-center lg:items-end">
            <div className="grid grid-cols-2 gap-4 w-full max-w-[400px]">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white/[0.06] border border-white/10 rounded-xl p-5 lg:p-6 backdrop-blur-md hover:bg-white/10 hover:border-teal/30 hover:-translate-y-0.5 transition-all"
                >
                  <div className="font-stats text-[clamp(1.5rem,3vw,2rem)] font-bold text-teal leading-none mb-1.5">
                    {stat.number}
                  </div>
                  <div className="text-xs text-white/60 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Team cluster */}
            <div className="mt-6 flex items-center gap-3 bg-white/[0.08] border border-white/12 rounded-full py-2.5 px-5 backdrop-blur-md">
              <div className="flex">
                {team.slice(0, 5).map((member, i) => (
                  <Image
                    key={member.slug}
                    src={member.image}
                    alt=""
                    width={36}
                    height={36}
                    className={`w-9 h-9 rounded-full border-2 border-navy object-cover object-top ${i > 0 ? "-ml-2.5" : ""}`}
                  />
                ))}
              </div>
              <div className="text-xs text-white/80 font-medium leading-tight">
                <strong className="block text-white font-stats font-bold">7 especialistas</strong>
                te atienden en Tenerife
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}