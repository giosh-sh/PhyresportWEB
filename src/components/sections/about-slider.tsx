"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AboutSlide {
  id: string;
  image: string;
  title?: string;
}

export function AboutSlider({ slides }: { slides: AboutSlide[] }) {
  const [index, setIndex] = useState(0);
  const count = slides.length;
  const prefersReduced = useRef(false);

  useEffect(() => {
    prefersReduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const go = useCallback(
    (dir: number) => {
      setIndex((i) => (i + dir + count) % count);
    },
    [count]
  );

  useEffect(() => {
    if (count <= 1 || prefersReduced.current) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), 5000);
    return () => clearInterval(t);
  }, [count]);

  if (count === 0) return null;

  return (
    <div className="relative group">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-xl bg-ice">
        {slides.map((s, i) => (
          <Image
            key={s.id}
            src={s.image}
            alt={s.title ?? "Instalaciones de Phyresport en Santa Cruz de Tenerife"}
            fill
            sizes="(min-width: 1024px) 560px, 100vw"
            className={cn(
              "object-cover transition-opacity duration-700",
              i === index ? "opacity-100" : "opacity-0"
            )}
            loading={i === 0 ? "lazy" : "lazy"}
          />
        ))}

        {count > 1 && (
          <>
            <button
              type="button"
              aria-label="Foto anterior"
              onClick={() => go(-1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/85 text-navy shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:bg-white transition-opacity"
            >
              <ChevronLeft className="w-5 h-5" aria-hidden />
            </button>
            <button
              type="button"
              aria-label="Foto siguiente"
              onClick={() => go(1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/85 text-navy shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:bg-white transition-opacity"
            >
              <ChevronRight className="w-5 h-5" aria-hidden />
            </button>
            <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-1.5">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Ir a la foto ${i + 1}`}
                  aria-current={i === index}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === index ? "w-6 bg-teal" : "w-1.5 bg-white/60 hover:bg-white"
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}