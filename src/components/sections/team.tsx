import Image from "next/image";
import Link from "next/link";
import { team } from "@/lib/data";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export function TeamSection() {
  return (
    <section className="py-24 lg:py-28" id="equipo">
      <div className="mx-auto max-w-7xl px-6">
        <ScrollReveal>
          <div className="text-center mb-16">
            <p className="font-stats text-[13px] font-medium tracking-widest uppercase text-teal mb-3">
              Nuestro equipo
            </p>
            <h2 className="font-display text-[clamp(1.75rem,3.5vw,2.75rem)] font-bold leading-tight tracking-tight text-charcoal mb-4">
              Especialistas comprometidos con tu bienestar
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Un equipo multidisciplinar con formación continua y experiencia clínica real.
            </p>
          </div>
        </ScrollReveal>

        <div className="flex flex-wrap justify-center gap-8">
          {team.map((member, i) => (
            <ScrollReveal
              key={member.slug}
              delay={i * 80}
              className="w-full sm:w-[calc(50%-1rem)] lg:w-[calc(25%-1.5rem)]"
            >
              <Link
                href={`/equipo/${member.slug}`}
                className="group block text-center p-6 rounded-xl hover:bg-ice transition-all"
              >
                <div className="relative w-[140px] h-[140px] mx-auto mb-5">
                  <div className="absolute inset-[-4px] rounded-full border-2 border-dashed border-transparent group-hover:border-teal/30 transition-colors" />
                  <Image
                    src={member.image}
                    alt={member.fullName}
                    width={140}
                    height={140}
                    className="w-[140px] h-[140px] rounded-full object-cover object-top border-[3px] border-gray-200 group-hover:border-teal transition-colors"
                    loading="lazy"
                  />
                </div>
                <h3 className="font-display text-[17px] font-bold text-navy mb-1">
                  {member.name}
                </h3>
                <p className="text-xs font-semibold text-teal uppercase tracking-wider mb-2">
                  {member.role}
                </p>
                <p className="text-sm text-gray-500 leading-relaxed">{member.description}</p>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
