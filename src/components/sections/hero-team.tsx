"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { team } from "@/lib/data";

/**
 * Cluster de especialistas del hero: al pasar el ratón el avatar sale hacia
 * delante con animación y al hacer clic lleva a la página del especialista.
 */
export function HeroTeam() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="mt-6 flex items-center gap-3 bg-white/[0.08] border border-white/12 rounded-full py-2.5 pl-5 pr-5 backdrop-blur-md">
      <div className="flex pt-4 -mb-4">
        {team.map((member, i) => (
          <motion.div
            key={member.slug}
            className={`relative ${i > 0 ? "-ml-2.5" : ""}`}
            style={{ zIndex: hovered === member.slug ? 50 : i + 1 }}
            animate={{
              y: hovered === member.slug ? -10 : 0,
              scale: hovered === member.slug ? 1.25 : 1,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            onHoverStart={() => setHovered(member.slug)}
            onHoverEnd={() => setHovered(null)}
          >
            <Link
              href={`/equipo/${member.slug}`}
              aria-label={`Ver perfil de ${member.fullName}`}
              className="block focus-visible:outline-none"
            >
              <span
                className={`block rounded-full overflow-hidden border-2 transition-colors ${
                  hovered === member.slug ? "border-teal" : "border-navy"
                }`}
              >
                <Image
                  src={member.image}
                  alt={member.fullName}
                  width={36}
                  height={36}
                  sizes="36px"
                  className="w-9 h-9 rounded-full object-cover object-top"
                />
              </span>
            </Link>

            {hovered === member.slug && (
              <motion.span
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="pointer-events-none absolute -top-9 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md bg-navy px-2.5 py-1 text-[11px] font-medium text-white shadow-lg ring-1 ring-white/10"
              >
                {member.name}
              </motion.span>
            )}
          </motion.div>
        ))}
      </div>
      <div className="text-xs text-white/80 font-medium leading-tight">
        <strong className="block text-white font-stats font-bold">7 especialistas</strong>
        te atienden en Tenerife
      </div>
    </div>
  );
}
