import type { Metadata } from "next";
import { Sora, Inter, Space_Grotesk } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { siteConfig } from "@/lib/data";
import CartDrawerWrapper from "@/components/CartDrawerWrapper";
import FavoritesHydrator from "@/components/FavoritesHydrator";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} — Fisioterapia Deportiva de Precisión en Tenerife`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    locale: "es_ES",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${sora.variable} ${inter.variable} ${spaceGrotesk.variable}`}
    >
      <body className="min-h-screen bg-white text-charcoal font-body antialiased">
        <ClerkProvider>
          {children}
          <CartDrawerWrapper />
          <FavoritesHydrator />
        </ClerkProvider>
      </body>
    </html>
  );
}
