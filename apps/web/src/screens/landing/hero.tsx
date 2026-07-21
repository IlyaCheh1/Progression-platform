"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Button from "@/components/ui/button";
import { useMobileMedia } from "@/hooks/landing/useMobileMedia";
import { isHeroVideoReady } from "@/lib/hero-video-ready";

const VIDEOS = ["1.mp4", "6.mp4", "2.mp4", "3.mp4", "4.mp4", "5.mp4"];

/** Mobile hero uses WebP posters — landscape crops need explicit focus points. */
const MOBILE_IMAGES = [
  { file: "1.webp", position: "object-[72%_center]" },
  { file: "6.webp", position: "object-center" },
  { file: "2.webp", position: "object-[45%_center]" },
  { file: "3.webp", position: "object-[58%_center]" },
  { file: "4.webp", position: "object-[55%_center]" },
] as const;

/** Same-origin files from the Next.js public/ folder (always deployed with the web app). */
const LOCAL_MEDIA_BASE = "/media/hero";

/**
 * Selectel public domain is https://<bucket-uuid>.selstorage.ru/<key>.
 * Bucket name (e.g. swordmaster.selstorage.ru) is NOT a valid public host — use the UUID from Selectel.
 * Older upload scripts printed .../selstorage.ru/<bucket>/media/hero — strip the extra segment.
 */
function normalizeMediaBase(raw: string): string {
  const trimmed = raw.trim().replace(/\/$/, "");
  try {
    const url = new URL(trimmed);
    const host = url.hostname.toLowerCase();
    if (host.endsWith(".selstorage.ru") || host.endsWith(".selcdn.ru")) {
      const parts = url.pathname.split("/").filter(Boolean);
      const mediaIdx = parts.indexOf("media");
      if (mediaIdx > 0) {
        url.pathname = `/${parts.slice(mediaIdx).join("/")}`;
        return url.toString().replace(/\/$/, "");
      }
    }
  } catch {
    // relative /media/hero
  }
  return trimmed;
}

const REMOTE_MEDIA_BASE = normalizeMediaBase(process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? LOCAL_MEDIA_BASE);
const CAN_FALLBACK_TO_LOCAL = REMOTE_MEDIA_BASE !== LOCAL_MEDIA_BASE;

function mediaUrl(file: string, useLocal = false) {
  const base = useLocal ? LOCAL_MEDIA_BASE : REMOTE_MEDIA_BASE;
  return `${base}/${file}`;
}

function posterUrl(file: string, useLocal = false) {
  return mediaUrl(file.replace(/\.mp4$/i, ".webp"), useLocal);
}

type Particle = {
  id: number;
  x: number;
  color: string;
  size: number;
  duration: number;
  delay: number;
};

function HeroImageSlide({
  file,
  positionClass,
  isMounted,
  fetchPriority,
}: {
  file: string;
  positionClass: string;
  isMounted: boolean;
  fetchPriority: "high" | "low";
}) {
  if (!isMounted) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={mediaUrl(file, true)}
      alt=""
      className={`h-full w-full object-cover ${positionClass}`}
      style={{ filter: "saturate(1.8) brightness(0.35)" }}
      decoding="async"
      fetchPriority={fetchPriority}
    />
  );
}

function HeroVideoSlide({
  index,
  file,
  isActive,
  isNext,
  isMounted,
  reduceMotion,
  registerVideo,
}: {
  index: number;
  file: string;
  isActive: boolean;
  isNext: boolean;
  isMounted: boolean;
  reduceMotion: boolean;
  registerVideo: (index: number, node: HTMLVideoElement | null) => void;
}) {
  const [useLocalFallback, setUseLocalFallback] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const poster = posterUrl(file, useLocalFallback);
  const videoSrc = mediaUrl(file, useLocalFallback);
  const mediaClassName = "h-full w-full object-cover object-center";

  const syncVideoReady = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      setVideoReady(isHeroVideoReady(video.readyState));
    }
  }, []);

  const fallBackToLocal = useCallback(() => {
    if (!CAN_FALLBACK_TO_LOCAL || useLocalFallback) return;
    setUseLocalFallback(true);
    setVideoReady(false);
  }, [useLocalFallback]);

  const handleVideoRef = useCallback(
    (node: HTMLVideoElement | null) => {
      videoRef.current = node;
      registerVideo(index, node);
    },
    [index, registerVideo],
  );

  useEffect(() => {
    if (!isMounted) {
      setVideoReady(false);
      setUseLocalFallback(false);
    }
  }, [isMounted]);

  useLayoutEffect(() => {
    const video = videoRef.current;
    if (!isMounted || !video) {
      setVideoReady(false);
      return;
    }

    const sync = () => {
      setVideoReady(isHeroVideoReady(video.readyState));
    };

    sync();
    video.addEventListener("canplay", sync);
    video.addEventListener("loadeddata", sync);

    return () => {
      video.removeEventListener("canplay", sync);
      video.removeEventListener("loadeddata", sync);
    };
  }, [isMounted, videoSrc]);

  if (!isMounted) return null;

  if (reduceMotion) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={poster}
        alt=""
        className={mediaClassName}
        style={{ filter: "saturate(1.8) brightness(0.35)" }}
        decoding="async"
        fetchPriority={index === 0 ? "high" : "low"}
        onError={fallBackToLocal}
      />
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={poster}
        alt=""
        aria-hidden
        className={`absolute inset-0 transition-opacity duration-300 ${mediaClassName}`}
        style={{
          filter: "saturate(1.8) brightness(0.35)",
          opacity: videoReady && isActive ? 0 : 1,
        }}
        decoding="async"
        fetchPriority={index === 0 ? "high" : "low"}
        onError={fallBackToLocal}
      />
      <video
        key={videoSrc}
        ref={handleVideoRef}
        className={`absolute inset-0 transition-opacity duration-300 ${mediaClassName}`}
        style={{
          filter: "saturate(1.8) brightness(0.35)",
          opacity: videoReady ? 1 : 0,
          transform: "translateZ(0)",
        }}
        muted
        loop
        playsInline
        preload={isActive || isNext || index === 0 ? "auto" : "metadata"}
        poster={poster}
        src={videoSrc}
        onCanPlay={syncVideoReady}
        onLoadedData={syncVideoReady}
        onError={fallBackToLocal}
      />
    </div>
  );
}

export default function Hero() {
  const isMobile = useMobileMedia();
  const slideCount = isMobile ? MOBILE_IMAGES.length : VIDEOS.length;
  const [idx, setIdx] = useState(0);
  const [mountedSlides, setMountedSlides] = useState(() => new Set([0, 1]));
  const [particles, setParticles] = useState<Particle[]>([]);
  const [reduceMotion, setReduceMotion] = useState(false);
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());

  const registerVideo = useCallback((index: number, node: HTMLVideoElement | null) => {
    if (node) videoRefs.current.set(index, node);
    else videoRefs.current.delete(index);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    setIdx(0);
    setMountedSlides(new Set([0, 1]));
  }, [isMobile]);

  useEffect(() => {
    if (reduceMotion) return;
    const interval = setInterval(() => {
      setIdx((i) => (i + 1) % slideCount);
    }, 5000);
    return () => clearInterval(interval);
  }, [reduceMotion, slideCount]);

  useEffect(() => {
    const next = (idx + 1) % slideCount;
    setMountedSlides((prev) => {
      const nextSet = new Set(prev);
      nextSet.add(idx);
      nextSet.add(next);
      if (isMobile && nextSet.size > 3) {
        return new Set([idx, next, (idx + slideCount - 1) % slideCount]);
      }
      return nextSet;
    });
  }, [idx, isMobile, slideCount]);

  useEffect(() => {
    if (isMobile || reduceMotion) return;

    const next = (idx + 1) % slideCount;
    videoRefs.current.forEach((video, index) => {
      if (index === idx || index === next) {
        void video.play().catch(() => {});
        return;
      }
      video.pause();
    });
  }, [idx, mountedSlides, reduceMotion, isMobile, slideCount]);

  useEffect(() => {
    if (isMobile || reduceMotion) {
      setParticles([]);
      return;
    }
    const colors = ["#d4a84b", "#f0c35a", "#c8c6c2"];
    setParticles(
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 6 + 2,
        duration: (Math.random() * 8 + 4) * 1.95,
        delay: Math.random() * 6,
      })),
    );
  }, [isMobile, reduceMotion]);

  return (
    <section id="hero" className="relative h-screen w-full overflow-hidden" style={{ background: "var(--void)" }}>
      {isMobile
        ? MOBILE_IMAGES.map((slide, i) => {
            const isActive = i === idx;
            const isMounted = mountedSlides.has(i);
            return (
              <div
                key={slide.file}
                className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
                style={{
                  opacity: isActive ? 1 : 0,
                  zIndex: isActive ? 1 : 0,
                  pointerEvents: "none",
                  willChange: "opacity",
                }}
                aria-hidden={!isActive}
              >
                <HeroImageSlide
                  file={slide.file}
                  positionClass={slide.position}
                  isMounted={isMounted}
                  fetchPriority={i === 0 ? "high" : "low"}
                />
              </div>
            );
          })
        : VIDEOS.map((file, i) => {
            const isActive = i === idx;
            const isNext = i === (idx + 1) % VIDEOS.length;
            const isMounted = mountedSlides.has(i);
            return (
              <div
                key={file}
                className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
                style={{
                  opacity: isActive ? 1 : 0,
                  zIndex: isActive ? 1 : 0,
                  pointerEvents: "none",
                  willChange: "opacity",
                }}
                aria-hidden={!isActive}
              >
                <HeroVideoSlide
                  index={i}
                  file={file}
                  isActive={isActive}
                  isNext={isNext}
                  isMounted={isMounted}
                  reduceMotion={reduceMotion}
                  registerVideo={registerVideo}
                />
              </div>
            );
          })}

      <div className="video-overlay pointer-events-none absolute inset-0" style={{ zIndex: 2 }} />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          zIndex: 2,
          background:
            "radial-gradient(ellipse at 20% 50%, rgba(196,92,42,0.18) 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, rgba(212,168,75,0.16) 0%, transparent 60%)",
        }}
      />

      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: `${p.x}%`,
            bottom: "-10px",
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            zIndex: 3,
            background: p.color,
            borderRadius: "9999px",
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
          }}
        />
      ))}

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 pb-28 text-center">
        <div className="flex w-full flex-col items-center gap-8 md:gap-10">
          <h1
            className="mobile-fluid-hero-title flex max-w-4xl flex-col items-center gap-4 font-unbounded font-medium tracking-tight md:gap-6 lg:gap-7"
            style={{ textShadow: "0 0 60px rgba(212,168,75,0.28)" }}
          >
            <span className="block text-white leading-tight">Играй. Тренируйся.</span>
            <span className="block leading-tight" style={{ color: "var(--color-controlsPrimaryActive)" }}>
              Прокачивай персонажа.
            </span>
          </h1>

          <div className="grid w-full max-w-[14rem] grid-cols-1 gap-4 sm:max-w-md sm:grid-cols-2">
            <Button href="/login" variant="primary" size="lg" className="w-full px-6 uppercase">
              Начать путь
            </Button>
            <Button href="#directions" variant="magenta" size="lg" className="w-full px-6 uppercase">
              Направления
            </Button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 z-10 flex w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 flex-col items-center gap-2 px-3 text-center sm:w-auto sm:px-6">
        <p className="font-golos text-[calc(0.875rem+2pt)] font-medium leading-relaxed text-white/60 md:text-[calc(0.875rem+4pt)]">
          Школа исторического фехтования с RPG-прокачкой:
          <br />
          опыт, способности, достижения и награды за тренировки.
        </p>
        <div className="relative h-12 w-px overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
          <div
            className="absolute top-0 h-4 w-full animate-bounce"
            style={{ background: "linear-gradient(to bottom, var(--mos-amber), transparent)" }}
          />
        </div>
      </div>
    </section>
  );
}
