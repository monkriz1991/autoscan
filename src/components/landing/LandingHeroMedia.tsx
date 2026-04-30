"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useState, type CSSProperties } from "react";

const LandingVideo = dynamic(() => import("./LandingVideo"), {
  ssr: false,
  loading: () => (
    <div
      style={{ position: "absolute", inset: 0, background: "#0e0f11" }}
      aria-hidden
    />
  ),
});

const WIDE_MQ = "(min-width: 768px)";

type Props = {
  webmSrc?: string;
  mp4Src: string;
  poster: string;
  /** Alt для LCP-постера и для кадра видео (SEO). */
  posterAlt: string;
  className?: string;
  style?: CSSProperties;
};

/**
 * Герой: на узких экранах только оптимизированный poster (LCP, без видео/blur/декодера).
 * Видео и чанк LandingVideo подгружаются только при min-width: 768px.
 */
export default function LandingHeroMedia({ webmSrc, mp4Src, poster, posterAlt, className, style }: Props) {
  const [isWide, setIsWide] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia(WIDE_MQ);
    const sync = () => setIsWide(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const videoStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: "center",
    pointerEvents: "none",
    display: "block",
    transform: "scale(1.08)",
    filter: "blur(6px)",
    ...style,
  };

  if (isWide !== true) {
    return (
      <div style={{ position: "absolute", inset: 0 }} aria-hidden={!posterAlt}>
        <Image
          src={poster}
          alt={posterAlt}
          fill
          priority
          sizes="100vw"
          className="landing-hero__poster-lcp"
        />
      </div>
    );
  }

  return (
    <LandingVideo
      webmSrc={webmSrc}
      mp4Src={mp4Src}
      poster={poster}
      posterAlt={posterAlt}
      priority="hero"
      className={className}
      preload="none"
      style={videoStyle}
    />
  );
}
