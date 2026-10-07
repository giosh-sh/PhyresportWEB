"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { SignInButton, SignUpButton, Show, UserButton, useUser } from "@clerk/nextjs";
import { siteConfig } from "@/lib/data";
import { Menu, X, ShoppingBag, Heart, ChevronDown, Shield, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import { useFavoritesStore } from "@/store/favorites-store";
import type { Category } from "@/types/product";

const STATIC_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/cursos", label: "Cursos" },
  { href: "/tienda", label: "Tienda" },
  { href: "/contacto", label: "Contacto" },
];

function slugToHref(slug: string): string {
  if (slug === "inicio") return "/";
  if (slug === "servicios") return "/servicios";
  if (slug === "cursos") return "/cursos";
  if (slug === "phyresport-products" || slug === "productos" || slug === "shop" || slug === "tienda") return "/tienda";
  if (slug === "contacto") return "/contacto";
  if (slug === "fisioterapia" || slug === "osteopatia" || slug === "osteopat-a" || slug === "terapia-manual") {
    return `/servicios/${slug.replace("-a", "ia")}`;
  }
  return `/categoria/${slug}`;
}

export function Header({
  solid = false,
  categories = [],
}: {
  solid?: boolean;
  categories?: Category[];
}) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const isSolid = scrolled || solid;

  const rootCategories = categories.filter((c) => !c.parent_id);

  const navItems = [
    ...rootCategories.map((c) => ({ ...c, href: slugToHref(c.slug) })),
    ...STATIC_LINKS,
  ].filter(
    (item, index, arr) =>
      arr.findIndex((x) => (x as { href?: string }).href === (item as { href?: string }).href) === index
  );

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-400",
          isSolid
            ? "bg-navy/95 backdrop-blur-xl py-3 shadow-lg"
            : "bg-transparent py-4"
        )}
      >
        <div className="w-full px-4 sm:px-6 lg:px-10 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            aria-label={`${siteConfig.name} — Inicio`}
            className="font-display text-lg lg:text-xl font-extrabold tracking-[0.18em] uppercase text-white hover:text-teal transition-colors"
          >
            Phyresport
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Navegación principal">
            {navItems.map((item) => {
              const href = (item as { href?: string }).href;
              const label = (item as { label?: string }).label;
              const isCategory = Boolean((item as Category).id);
              const cat = isCategory ? (item as Category) : null;
              const hasChildren = cat?.children && cat.children.length > 0;

              if (hasChildren) {
                return (
                  <CategoryDropdown key={cat!.id} category={cat!} />
                );
              }

              return (
                <Link
                  key={href || cat!.id}
                  href={href || slugToHref(cat!.slug)}
                  className="font-display text-sm font-medium text-white/75 hover:text-white transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-teal after:transition-all hover:after:w-full"
                >
                  {label || cat!.name}
                </Link>
              );
            })}
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <Link
              href="/wishlist"
              className="hidden sm:flex items-center justify-center w-9 h-9 rounded-full border border-white/20 text-white/70 hover:text-white hover:border-teal hover:bg-white/5 transition-all"
              aria-label="Favoritos"
            >
              <Heart className="w-4 h-4" />
            </Link>
            <CartButton />

            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="hidden sm:flex items-center px-4 py-2.5 text-white font-display text-xs font-semibold rounded-full border border-white/25 hover:border-white/60 hover:bg-white/10 transition-all">
                  Iniciar sesión
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-teal text-white font-display text-xs font-semibold rounded-full hover:bg-teal/90 transition-all hover:-translate-y-0.5">
                  Crear cuenta
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-9 h-9",
                  },
                }}
              >
                <UserButton.MenuItems>
                  <UserButton.Link
                    href="/orders"
                    label="Mis pedidos"
                    labelIcon={<Package className="w-4 h-4" />}
                  />
                </UserButton.MenuItems>
              </UserButton>
            </Show>
            <AdminLink />

            <a
              href={siteConfig.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-whatsapp text-white font-display text-xs font-semibold rounded-full hover:bg-whatsapp/90 transition-all hover:-translate-y-0.5"
            >
              <WhatsAppIcon className="w-4 h-4" />
              <span>Contactar</span>
            </a>

            <button
              className="md:hidden p-2 text-white"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menú"
              aria-expanded={mobileOpen}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Nav Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[200] bg-navy/[0.97] backdrop-blur-xl flex flex-col items-center justify-center gap-6"
          role="dialog"
          aria-label="Menú de navegación"
        >
          <button
            className="absolute top-5 right-6 p-2 text-white"
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar menú"
          >
            <X className="w-7 h-7" />
          </button>

          {navItems.map((item) => {
            const href = (item as { href?: string }).href;
            const label = (item as { label?: string }).label;
            const cat = (item as { id?: string }).id ? (item as Category) : null;
            return (
              <Link
                key={href || cat!.id}
                href={href || slugToHref(cat!.slug)}
                onClick={() => setMobileOpen(false)}
                className="font-display text-2xl font-bold text-white hover:text-teal transition-colors"
              >
                {label || cat!.name}
              </Link>
            );
          })}

          <a
            href={siteConfig.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 px-8 py-3 bg-teal text-white font-display font-semibold rounded-full"
          >
            Contactar por WhatsApp
          </a>

          <div className="flex items-center gap-4 mt-2">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="px-6 py-2.5 text-white font-display text-sm font-semibold rounded-full border border-white/25 hover:border-white/60 transition-colors">
                  Iniciar sesión
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="px-6 py-2.5 bg-teal text-white font-display text-sm font-semibold rounded-full">
                  Crear cuenta
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <div className="flex flex-col items-center gap-3">
                <Link
                  href="/orders"
                  onClick={() => setMobileOpen(false)}
                  className="font-display text-sm font-semibold text-white/80 hover:text-teal transition-colors"
                >
                  Mis pedidos
                </Link>
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "w-10 h-10",
                    },
                  }}
                />
              </div>
            </Show>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/wishlist"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 text-white/80 hover:text-teal transition-colors"
            >
              <Heart className="w-5 h-5" />
              Favoritos
            </Link>
            <CartButton mobile />
            <AdminLink mobile />
          </div>
        </div>
      )}
    </>
  );
}

function CartButton({ mobile }: { mobile?: boolean }) {
  const items = useCartStore((s) => s.items);
  const toggleCart = useCartStore((s) => s.toggleCart);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  if (mobile) {
    return (
      <button
        onClick={toggleCart}
        className="flex items-center gap-2 text-white/80 hover:text-teal transition-colors relative"
        aria-label="Carrito"
      >
        <ShoppingBag className="w-5 h-5" />
        Carrito
        {count > 0 && (
          <span className="flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full bg-teal text-white text-[10px] font-semibold leading-none">
            {count > 99 ? "99" : count}
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={toggleCart}
      className="hidden sm:flex items-center justify-center w-9 h-9 rounded-full border border-white/20 text-white/70 hover:text-white hover:border-teal hover:bg-white/5 transition-all relative"
      aria-label="Carrito"
    >
      <ShoppingBag className="w-4 h-4" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-teal text-white text-[10px] font-semibold leading-none">
          {count > 99 ? "99" : count}
        </span>
      )}
    </button>
  );
}

function AdminLink({ mobile }: { mobile?: boolean }) {
  const { isSignedIn, user } = useUser();
  const role = (user?.publicMetadata as { role?: string } | undefined)?.role;
  const isAdmin = !!isSignedIn && role === "admin";

  if (!isAdmin) return null;

  if (mobile) {
    return (
      <Link
        href="/admin"
        onClick={() => {}}
        className="flex items-center gap-2 text-teal hover:text-white transition-colors font-display text-sm font-semibold"
      >
        <Shield className="w-5 h-5" />
        Admin
      </Link>
    );
  }

  return (
    <Link
      href="/admin"
      className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-full border border-teal/40 text-teal hover:bg-teal/10 hover:border-teal transition-all font-display text-xs font-semibold"
    >
      <Shield className="w-3.5 h-3.5" />
      Admin
    </Link>
  );
}

function CategoryDropdown({ category }: { category: Category }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Link
        href={slugToHref(category.slug)}
        aria-expanded={open}
        className="inline-flex items-center gap-1 font-display text-sm font-medium text-white/75 hover:text-white transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-teal after:transition-all hover:after:w-full"
      >
        {category.name}
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </Link>

      {open && (
        <div className="absolute left-0 top-full pt-3">
          <div className="w-64 rounded-xl border border-gray-100 bg-white p-2 shadow-xl">
            {(category.children ?? []).map((child) => (
              <Link
                key={child.id}
                href={slugToHref(child.slug)}
                className="block rounded-lg px-4 py-2.5 text-sm font-medium text-navy hover:bg-ice hover:text-teal transition-colors"
              >
                {child.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
