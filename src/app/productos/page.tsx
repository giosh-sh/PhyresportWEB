import Image from "next/image";
import type { Metadata } from "next";
import { products, siteConfig } from "@/lib/data";
import HeaderWrapper from "@/components/layout/header-wrapper";
import { Footer } from "@/components/layout/footer";
import { WhatsAppFloat } from "@/components/ui/whatsapp-float";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { ArrowRight, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Productos",
  description:
    "Dispositivos y equipos profesionales para fisioterapia y rehabilitación deportiva.",
};

export default function ProductosPage() {
  return (
    <>
      <HeaderWrapper />
      <main>
        {/* Hero */}
        <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-20 bg-navy">
          <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
            <p className="font-stats text-[13px] font-medium tracking-widest uppercase text-teal mb-3">
              Equipamiento
            </p>
            <h1 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-extrabold leading-tight tracking-tight text-white mb-4">
              Productos disponibles
            </h1>
            <p className="text-lg text-white/70 max-w-xl mx-auto">
              Dispositivos y equipos profesionales para fisioterapia y rehabilitación deportiva.
            </p>
          </div>
        </section>

        {/* Products */}
        <section className="py-16 lg:py-20">
          <div className="mx-auto max-w-5xl px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {products.map((product, i) => (
                <ScrollReveal key={product.slug} delay={i * 100}>
                  <div className="group bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all">
                    <div className="aspect-[4/3] overflow-hidden bg-ice">
                      <Image
                        src={product.image}
                        alt={product.title}
                        width={500}
                        height={375}
                        className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-6">
                      <h2 className="font-display text-xl font-bold text-navy mb-2">
                        {product.title}
                      </h2>
                      <p className="text-[15px] text-gray-500 leading-relaxed mb-4">
                        {product.description}
                      </p>
                      <div className="flex flex-wrap gap-3">
                        {product.catalogPdf && (
                          <a
                            href={product.catalogPdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-ice text-navy font-display font-semibold text-xs rounded-full hover:bg-teal hover:text-white transition-all"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Catálogo PDF
                          </a>
                        )}
                        <a
                          href={siteConfig.whatsappHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-teal text-white font-display font-semibold text-xs rounded-full hover:bg-cyan transition-all"
                        >
                          Consultar precio
                          <ArrowRight className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
