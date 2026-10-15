"use client";

import { useEffect, useRef } from "react";

export function GymVideo({ src, poster }: { src: string; poster?: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    // Forzamos muted como propiedad (React a veces solo lo pone como atributo,
    // lo que puede impedir el autoplay) y aseguramos la reproducción continua.
    video.muted = true;
    video.defaultMuted = true;

    const tryPlay = () => {
      const p = video.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    };

    tryPlay();
    video.addEventListener("loadeddata", tryPlay);
    video.addEventListener("canplay", tryPlay);
    return () => {
      video.removeEventListener("loadeddata", tryPlay);
      video.removeEventListener("canplay", tryPlay);
    };
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-navy shadow-[0_24px_80px_rgba(0,0,0,0.25)]">
      <video
        ref={ref}
        className="w-full h-auto aspect-video object-cover"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        controlsList="nodownload noplaybackrate nofullscreen"
        poster={poster}
      >
        <source src={src} type="video/mp4" />
        Tu navegador no soporta la reproducción de vídeo.
      </video>
    </div>
  );
}
