"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReadMoreProps {
  text: string;
  className?: string;
  textClassName?: string;
}

export function ReadMore({ text, className, textClassName }: ReadMoreProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={className}>
      <p
        className={cn(
          "text-[15px] text-gray-500 leading-relaxed",
          !open && "line-clamp-3",
          textClassName
        )}
      >
        {text}
      </p>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mt-3 inline-flex items-center gap-1.5 font-display text-sm font-semibold text-teal hover:text-cyan transition-colors"
      >
        {open ? "Leer menos" : "Leer más"}
        <ChevronDown
          className={cn("w-4 h-4 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>
    </div>
  );
}
