import Link from "next/link";
import Image from "next/image";
import { siteConfig, services } from "@/lib/data";
import { MapPin, Phone, Clock } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate text-white/70">
      <div className="mx-auto max-w-7xl px-6 pt-16 pb-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 pb-12">
          {/* Brand */}
          <div>
            <Image
              src={siteConfig.logo}
              alt={siteConfig.name}
              width={140}
              height={36}
              className="h-9 w-auto brightness-0 invert"
            />
            <p className="mt-4 text-sm leading-relaxed max-w-[280px]">
              {siteConfig.description}
            </p>
            <div className="flex gap-3 mt-5">
              <a
                href={siteConfig.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/8 flex items-center justify-center text-white/70 hover:bg-teal hover:text-white transition-all"
                aria-label="Facebook"
              >
                <FacebookIcon className="w-[18px] h-[18px]" />
              </a>
              <a
                href={siteConfig.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/8 flex items-center justify-center text-white/70 hover:bg-teal hover:text-white transition-all"
                aria-label="WhatsApp"
              >
                <WhatsAppIcon className="w-[18px] h-[18px]" />
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-display text-xs font-bold text-white uppercase tracking-widest mb-5">
              Servicios
            </h4>
            <ul className="space-y-2.5">
              {services.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/servicios/${s.slug}`}
                    className="text-[15px] hover:text-teal transition-colors"
                  >
                    {s.shortTitle}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Training */}
          <div>
            <h4 className="font-display text-xs font-bold text-white uppercase tracking-widest mb-5">
              Formación
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/cursos" className="text-[15px] hover:text-teal transition-colors">
                  EPI en Neuroeje
                </Link>
              </li>
              <li>
                <Link href="/cursos" className="text-[15px] hover:text-teal transition-colors">
                  EPI Nivel I
                </Link>
              </li>
              <li>
                <a
                  href={siteConfig.bonificaTuCurso}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[15px] hover:text-teal transition-colors"
                >
                  Bonifica tu curso
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-xs font-bold text-white uppercase tracking-widest mb-5">
              Contacto
            </h4>
            <div className="space-y-3.5">
              <div className="flex items-start gap-2.5 text-[15px]">
                <MapPin className="w-[18px] h-[18px] text-teal shrink-0 mt-0.5" />
                <span>
                  {siteConfig.address.street}
                  <br />
                  {siteConfig.address.city}
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-[15px]">
                <Phone className="w-[18px] h-[18px] text-teal shrink-0" />
                <a href={siteConfig.phoneHref} className="hover:text-teal transition-colors">
                  {siteConfig.phone}
                </a>
              </div>
              <div className="flex items-center gap-2.5 text-[15px]">
                <Clock className="w-[18px] h-[18px] text-teal shrink-0" />
                <span>{siteConfig.hours}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/8 py-5 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-white/40">
          <span>&copy; {new Date().getFullYear()} {siteConfig.name}. Todos los derechos reservados.</span>
          <Link href="/privacidad" className="hover:text-teal transition-colors">
            Política de privacidad
          </Link>
        </div>
      </div>
    </footer>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
