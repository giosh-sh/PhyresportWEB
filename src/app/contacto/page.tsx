import type { Metadata } from "next";
import { siteConfig } from "@/lib/data";
import HeaderWrapper from "@/components/layout/header-wrapper";
import { Footer } from "@/components/layout/footer";
import { WhatsAppFloat } from "@/components/ui/whatsapp-float";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { MapPin, Phone, Clock, Mail, Globe } from "lucide-react";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Contacta con Phyresport. Centro de fisioterapia deportiva en Santa Cruz de Tenerife.",
};

export default function ContactoPage() {
  return (
    <>
      <HeaderWrapper />
      <main>
        {/* Hero */}
        <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-20 bg-navy">
          <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
            <p className="font-stats text-[13px] font-medium tracking-widest uppercase text-teal mb-3">
              Contacto
            </p>
            <h1 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-extrabold leading-tight tracking-tight text-white mb-4">
              Visítanos o contacta con nosotros
            </h1>
            <p className="text-lg text-white/70 max-w-xl mx-auto">
              Estamos en el centro de Santa Cruz de Tenerife. Reserva tu cita o consulta cualquier
              duda.
            </p>
          </div>
        </section>

        {/* Contact Info */}
        <section className="py-16 lg:py-20">
          <div className="mx-auto max-w-5xl px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Info */}
              <ScrollReveal>
                <div className="space-y-8">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-navy mb-6">
                      Información de contacto
                    </h2>
                    <div className="space-y-5">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-ice flex items-center justify-center text-teal shrink-0">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-display font-bold text-navy text-sm mb-0.5">
                            Dirección
                          </p>
                          <p className="text-gray-500">
                            {siteConfig.address.street}
                            <br />
                            {siteConfig.address.city}
                            <br />
                            {siteConfig.address.region}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-ice flex items-center justify-center text-teal shrink-0">
                          <Phone className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-display font-bold text-navy text-sm mb-0.5">
                            Teléfono
                          </p>
                          <a
                            href={siteConfig.phoneHref}
                            className="text-gray-500 hover:text-teal transition-colors"
                          >
                            {siteConfig.phone}
                          </a>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-ice flex items-center justify-center text-teal shrink-0">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-display font-bold text-navy text-sm mb-0.5">
                            Horario
                          </p>
                          <p className="text-gray-500">{siteConfig.hours}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-ice flex items-center justify-center text-teal shrink-0">
                          <Globe className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-display font-bold text-navy text-sm mb-0.5">Web</p>
                          <a
                            href={siteConfig.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-500 hover:text-teal transition-colors"
                          >
                            {siteConfig.url}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="bg-ice rounded-xl p-6">
                    <h3 className="font-display font-bold text-navy mb-3">
                      ¿Prefieres WhatsApp?
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Envíanos un mensaje y te responderemos lo antes posible.
                    </p>
                    <a
                      href={siteConfig.whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-whatsapp text-white font-display font-semibold text-sm rounded-full hover:bg-whatsapp/90 transition-all"
                    >
                      <WhatsAppIcon className="w-5 h-5" />
                      Abrir WhatsApp
                    </a>
                  </div>
                </div>
              </ScrollReveal>

              {/* Map */}
              <ScrollReveal delay={150}>
                <div className="rounded-2xl overflow-hidden shadow-lg h-[400px] lg:h-full min-h-[400px] bg-gray-100">
                  <iframe
                    src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3507.5!2d-16.25!3d28.47!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjjCsDI4JzEyLjAiTiAxNsKwMTUnMDAuMCJX!5e0!3m2!1ses!2ses!4v1`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Ubicación de Phyresport en Google Maps"
                  />
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
