"use client";

import { useEffect, useRef } from "react";
import { directions } from "@/lib/content";
import { SCHOOL_COURSE_PAGES } from "@/lib/courses/data";
import { getSchoolColor } from "@/lib/school-colors";
import { useMobileMedia } from "@/hooks/landing/useMobileMedia";
import { useRoomsScroll } from "@/hooks/landing/useRoomsScroll";
import Button from "@/components/ui/button";

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function buildDirectionTheme(color: string) {
  const { r, g, b } = hexToRgb(color);
  return {
    color,
    glow: `rgba(${r}, ${g}, ${b}, 0.5)`,
    gradient: `linear-gradient(135deg, rgba(${r}, ${g}, ${b}, 0.82) 0%, rgba(${r}, ${g}, ${b}, 0.3) 55%, rgba(11, 11, 12, 0.5) 100%)`,
    gradientMobile: `linear-gradient(to bottom, rgba(${r}, ${g}, ${b}, 0.5) 0%, rgba(${r}, ${g}, ${b}, 0.2) 40%, rgba(11, 11, 12, 0.75) 100%)`,
  };
}

type DirectionSlide = {
  id: number;
  key: string;
  title: string;
  description: string;
  image: string;
  tag: string;
  stat: string;
  color: string;
  glow: string;
  gradient: string;
  gradientMobile: string;
};

export default function Directions() {
  const containerRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const isMobile = useMobileMedia();

  const slides: DirectionSlide[] = directions.map((direction, index) => {
    const theme = buildDirectionTheme(getSchoolColor(direction.key, index));
    return {
      id: index + 1,
      key: direction.key,
      title: direction.title,
      description: direction.description,
      image: `/media/directions/${index + 1}.jpg`,
      tag: "Направление",
      stat: "8 путей мастерства",
      ...theme,
    };
  });

  const { activeRoom, goToRoom } = useRoomsScroll(containerRef, trackRef, slides.length, undefined, isMobile);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measure = () => {
      container.style.setProperty("--room-middle-min-h", "0px");
      let max = 0;
      container.querySelectorAll<HTMLElement>(".room-panel-middle").forEach((el) => {
        max = Math.max(max, el.offsetHeight);
      });
      container.style.setProperty("--room-middle-min-h", `${max}px`);
    };

    measure();
    document.fonts?.ready.then(measure).catch(() => {});
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return (
    <section
      id="directions"
      ref={containerRef}
      className="relative"
      style={{ height: isMobile ? "100vh" : `${slides.length * 100}vh` }}
    >
      <div className="rooms-sticky sticky top-0 h-screen w-full overflow-hidden">
        <div className="absolute left-1/2 top-8 z-20 hidden -translate-x-1/2 items-center gap-3 text-xs font-semibold uppercase tracking-widest text-white/40 md:flex">
          <span>Направления</span>
          <span className="h-px w-8 bg-white/20" />
          <span style={{ color: "var(--mos-amber)" }}>
            {activeRoom + 1} / {slides.length}
          </span>
        </div>

        <div ref={trackRef} className="h-scroll-container h-full will-change-transform">
          {slides.map((slide, i) => (
            <DirectionPanel
              key={slide.key}
              slide={slide}
              index={i}
              isMobile={isMobile}
              shouldLoadMedia={isMobile ? Math.abs(i - activeRoom) <= 1 : Math.abs(i - activeRoom) <= 2}
              showDecor={!isMobile}
            />
          ))}
        </div>

        <div
          className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 gap-1"
          role="tablist"
          aria-label="Направления"
        >
          {slides.map((slide, i) => (
            <button
              key={slide.key}
              type="button"
              role="tab"
              aria-label={slide.title}
              aria-selected={i === activeRoom}
              onClick={() => goToRoom(i)}
              className="flex h-6 w-6 cursor-pointer items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
            >
              <span
                className="block h-2 w-2 rounded-full transition-transform duration-300 hover:scale-125"
                style={{
                  background: i === activeRoom ? slides[activeRoom].color : "rgba(255,255,255,0.2)",
                  transform: i === activeRoom ? "scale(1.5)" : "scale(1)",
                }}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function DirectionPanel({
  slide,
  index,
  isMobile,
  shouldLoadMedia,
  showDecor,
}: {
  slide: DirectionSlide;
  index: number;
  isMobile: boolean;
  shouldLoadMedia: boolean;
  showDecor: boolean;
}) {
  const isMontante = slide.key === "montante";

  return (
    <div
      className={`room-panel${isMontante ? " room-panel--montante" : ""}`}
      style={{ background: "var(--mos-bg)" }}
    >
      <div className="absolute inset-0">
        {shouldLoadMedia ? (
          isMontante ? (
            <div className="room-panel-image-zone--montante">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slide.image}
                alt={slide.title}
                className="room-panel-image--montante"
                style={{ filter: "saturate(1.15) brightness(0.9)" }}
                loading={index === 0 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : "low"}
              />
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={slide.image}
              alt={slide.title}
              className="absolute inset-0 h-full w-full object-cover"
              style={{ filter: "saturate(1.6) brightness(0.5)" }}
              loading={index === 0 ? "eager" : "lazy"}
              fetchPriority={index === 0 ? "high" : "low"}
            />
          )
        ) : (
          <div className="absolute inset-0" style={{ background: "var(--mos-bg)" }} aria-hidden />
        )}
      </div>

      <div className="room-panel-left-vignette absolute inset-0" aria-hidden />
      <div
        className="room-panel-color-mask absolute inset-0"
        style={{ background: isMobile ? slide.gradientMobile : slide.gradient, mixBlendMode: "multiply" }}
      />
      <div className="video-overlay absolute inset-0" />

      {showDecor && (
        <div
          className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: slide.glow, filter: "blur(80px)", opacity: 0.5 }}
        />
      )}

      {showDecor &&
        [20, 65, 40].map((top, particleIndex) => (
          <div
            key={particleIndex}
            className="particle absolute rounded-full"
            style={{
              top: `${top}%`,
              left: particleIndex === 2 ? "auto" : `${15 + particleIndex * 30}%`,
              right: particleIndex === 2 ? "10%" : "auto",
              width: `${4 + particleIndex * 2}px`,
              height: `${4 + particleIndex * 2}px`,
              background: slide.color,
              boxShadow: `0 0 ${12 + particleIndex * 4}px ${slide.glow}`,
              opacity: 0.6,
              animation: "float-particle 9s linear infinite",
              animationDelay: `${index * 0.4 + particleIndex * 0.3}s`,
            }}
          />
        ))}

      <div
        className={`room-panel-text relative z-10 flex h-full flex-col justify-end px-6 pb-24 md:px-24${
          isMontante ? " room-panel-text--montante" : " max-w-3xl"
        }`}
      >
        <div
          className="mb-6 inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
          style={{ background: `${slide.color}22`, color: slide.color }}
        >
          ✦ {slide.tag}
        </div>

        <h2
          className="mobile-fluid-room-title mb-4 font-unbounded font-medium leading-none md:text-[calc(4.5rem-3px)] lg:text-[calc(6rem-3px)]"
          style={{ color: slide.color, textShadow: `0 0 60px ${slide.glow}` }}
        >
          {isMontante ? (
            <>
              Иберийский<span className="room-panel-title-gap"> </span>
              <br className="room-panel-title-break" />
              <span className="room-panel-title-tail">двуручный меч</span>
            </>
          ) : (
            slide.title
          )}
        </h2>

        <div className="room-panel-middle">
          <p className="room-panel-tagline mb-4 max-w-lg font-light italic text-white/60">
            Горизонтальный путь школ — выбери клинок и стиль.
          </p>
          <p className="room-panel-description mb-8 max-w-md leading-relaxed text-white/50">
            {slide.description}
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: slide.color }}>
            <span>◆</span>
            <span>{slide.stat}</span>
          </div>
          <div className="h-px max-w-24 flex-1" style={{ background: `${slide.color}40` }} />
          <Button
            href={SCHOOL_COURSE_PAGES[slide.key]?.href ?? "#tariffs"}
            variant="secondary"
            size="sm"
            className="shrink-0 uppercase"
          >
            {SCHOOL_COURSE_PAGES[slide.key]?.cta ?? "Тарифы"}
          </Button>
        </div>
      </div>

      {showDecor && (
        <div
          className="absolute bottom-0 right-0 top-0 w-32"
          style={{ background: `linear-gradient(to left, ${slide.glow}, transparent)` }}
        />
      )}
    </div>
  );
}
