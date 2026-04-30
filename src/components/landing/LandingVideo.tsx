"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import Image from "next/image";

export type LandingVideoPriority = "hero" | "feature";

export type LandingVideoProps = {
  /** Путь к WebM/AV1 в public (например /vidio/preview.av1.webm). */
  webmSrc?: string;
  /** Путь к MP4 в public (например /vidio/preview.mp4). */
  mp4Src: string;
  /** Постер до загрузки и при ошибке источника. */
  poster?: string;
  /** Текст для alt у постера (SEO и скринридеры); обязателен, если постер не чисто декоративный. */
  posterAlt?: string;
  className?: string;
  style?: CSSProperties;
  /** Управляет тем, как рано IntersectionObserver начнёт загрузку относительно viewport. */
  priority?: LandingVideoPriority;
  muted?: boolean;
  loop?: boolean;
  playsInline?: boolean;
  /** Отключить автозапуск (например для prefers-reduced-motion). */
  autoPlay?: boolean;
  /** Ниже fold — `none`, чтобы не конкурировать с RSC/остальными ресурсами; hero — обычно `none` при наличии poster. */
  preload?: "none" | "metadata" | "auto";
};

/** Зона расширения viewport для начала загрузки: hero виден сразу — достаточно одного кадра. */
const ROOT_MARGIN_HERO = "50% 0px 50% 0px";
/** Фичи ниже fold — подгружаем при приближении к блоку. */
const ROOT_MARGIN_FEATURE = "0px 0px 480px 0px";

/**
 * Ленивое landing-видео: <source> монтируется только после пересечения с viewport,
 * при ошибке декодирования/сети остаётся постер без повторных попыток.
 */
export default function LandingVideo({
  webmSrc,
  mp4Src,
  poster,
  posterAlt = "",
  className,
  style,
  priority = "feature",
  muted = true,
  loop = true,
  playsInline = true,
  autoPlay = true,
  preload = "metadata",
}: LandingVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reducedMotion || failed) return;
    const el = containerRef.current;
    if (!el) return;

    const rootMargin =
      priority === "hero" ? ROOT_MARGIN_HERO : ROOT_MARGIN_FEATURE;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            io.disconnect();
            break;
          }
        }
      },
      { root: null, rootMargin, threshold: 0 },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [priority, reducedMotion, failed]);

  const onVideoError = useCallback(() => {
    setFailed(true);
  }, []);

  /** После монтирования источника пробуем воспроизведение (политика автоплея может отклонить — это не fatal). */
  useEffect(() => {
    if (!shouldLoad || reducedMotion || failed) return;
    const v = videoRef.current;
    if (!v || !autoPlay) return;
    void v.play().catch(() => {
      /* ignored: gesture/autoplay policy; onError ловит реальные ошибки источника */
    });
  }, [shouldLoad, reducedMotion, failed, autoPlay]);

  /** При reduced-motion видео не крутим — тот же постер, что и до загрузки (и для hero, и для feature). */
  if (reducedMotion) {
    if (poster) {
      return (
        <div ref={containerRef} style={{ position: "absolute", inset: 0 }}>
          <Image
            src={poster}
            alt={posterAlt}
            fill
            sizes={priority === "hero" ? "100vw" : "(max-width: 900px) 100vw, 50vw"}
            className={className}
            style={{ ...style, pointerEvents: "none", display: "block" }}
            aria-hidden={!posterAlt}
          />
        </div>
      );
    }
    return (
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }} aria-hidden />
    );
  }

  if (failed || !shouldLoad) {
    return (
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }}>
        {poster ? (
          <Image
            src={poster}
            alt={posterAlt}
            fill
            sizes={priority === "hero" ? "100vw" : "(max-width: 900px) 100vw, 50vw"}
            className={className}
            style={{ ...style, pointerEvents: "none", display: "block" }}
            aria-hidden={!posterAlt}
          />
        ) : (
          <div className={className} style={style} aria-hidden />
        )}
      </div>
    );
  }

  const effectiveAutoPlay = autoPlay && !reducedMotion;

  return (
    <div ref={containerRef} style={{ position: "absolute", inset: 0 }}>
      <video
        ref={videoRef}
        className={className}
        style={style}
        muted={muted}
        loop={loop}
        playsInline={playsInline}
        autoPlay={effectiveAutoPlay}
        preload={preload}
        poster={poster}
        onError={onVideoError}
        aria-hidden
      >
        {webmSrc ? <source src={webmSrc} type="video/webm" /> : null}
        <source src={mp4Src} type="video/mp4" />
      </video>
    </div>
  );
}
