import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { products, siteConfig } from "@/lib/data";
import HeaderWrapper from "@/components/layout/header-wrapper";
import { Footer } from "@/components/layout/footer";
import { WhatsAppFloat } from "@/components/ui/whatsapp-float";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { ArrowLeft, FileText, ArrowRight } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = products.find((p) => p.slug === slug);
  if (!product) return {};
  return {
    title: product.title,
    description: product.description,
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = products.find((p) => p.slug === slug);
  if (!product) notFound();

  return (
    <>
      <HeaderWrapper />
      <main>
        {/* Hero */}
        <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-20 bg-navy">
          <div className="relative z-10 mx-auto max-w-4xl px-6">
            <Link
              href="/productos"
              className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a productos
            </Link>
            <h1 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-extrabold leading-tight tracking-tight text-white">
              {product.title}
            </h1>
          </div>
        </section>

        {/* Content */}
        <section className="py-16 lg:py-20">
          <div className="mx-auto max-w-3xl px-6">
            <ScrollReveal>
              <div className="bg-ice rounded-2xl p-8 mb-10 flex justify-center">
                <Image
                  src={product.image}
                  alt={product.title}
                  width={500}
                  height={400}
                  className="max-w-full h-auto object-contain"
                  loading="lazy"
                />
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <p className="text-lg text-gray-500 leading-relaxed mb-8">
                {product.description}
              </p>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div className="flex flex-wrap gap-4">
                {product.catalogPdf && (
                  <a
                    href={product.catalogPdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-ice text-navy font-display font-semibold text-sm rounded-full hover:bg-teal hover:text-white transition-all"
                  >
                    <FileText className="w-4 h-4" />
                    Descargar catálogo
                  </a>
                )}
                <a
                  href={siteConfig.whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-teal text-white font-display font-semibold text-sm rounded-full hover:bg-cyan transition-all"
                >
                  Consultar precio
                  <ArrowRight className="w-4 h-4" />
                </a>
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
