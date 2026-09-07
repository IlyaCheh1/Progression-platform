"use client";

import { useEffect, useMemo, useRef } from "react";
import { directions } from "@/lib/content";
import { SCHOOL_COURSE_PAGES } from "@/lib/courses/data";
import { KIDS_SAGE, KIDS_WUSHU, kidsPhoneHref } from "@/lib/landing/kids-wushu";
import { RECONSTRUCTION_TRACKS } from "@/lib/landing/reconstruction";
import { getSchoolColor } from "@/lib/school-colors";
import { buildServiceButtonTheme } from "@/lib/service-button-theme";
import { useAudience } from "@/hooks/landing/useAudience";
import { useMobileMedia } from "@/hooks/landing/useMobileMedia";
import { useRoomsScroll } from "@/hooks/landing/useRoomsScroll";
import Button from "@/components/ui/button";

const SCHOOL_TAGLINE = "Горизонтальный путь школ — выбери клинок и стиль.";

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
  tagline: string;
  stat: string;
  href: string;
  cta: string;
  color: string;
  glow: string;
  gradient: string;
  gradientMobile: string;
  personaHref?: string;
  reconstruction?: boolean;
  tracks?: ReadonlyArray<{ id: string; title: string }>;
};

const KIDS_SLIDES: Omit<DirectionSlide, "id" | "color" | "glow" | "gradient" | "gradientMobile">[] = [
  {
    key: "kids-east",
    title: KIDS_WUSHU.section,
    description: KIDS_WUSHU.body,
    image: KIDS_WUSHU.media.hero,
    tag: KIDS_WUSHU.age,
    tagline: KIDS_WUSHU.slogan,
    stat: KIDS_WUSHU.cta,
    href: kidsPhoneHref(),
    cta: KIDS_WUSHU.enroll,
  },
  {
    key: "kids-program",
    title: "Путь чемпиона",
    description: `${KIDS_WUSHU.places}. Тренер — ${KIDS_WUSHU.trainerFull}.`,
    image: KIDS_WUSHU.media.trainer,
    tag: KIDS_WUSHU.school,
    tagline: KIDS_WUSHU.slogan,
    stat: KIDS_WUSHU.age,
    href: kidsPhoneHref(),
    cta: KIDS_WUSHU.cta,
    tracks: KIDS_WUSHU.bullets,
  },
];

function ArrowButton({
  label,
  direction,
  disabled,
  onClick,
}: {
  label: string;
  direction: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="rooms-arrow"
      data-direction={direction}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      {direction === "prev" ? "‹" : "›"}
    </button>
  );
}

export default function Directions() {
  const containerRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const isMobile = useMobileMedia();
  const { isKids } = useAudience();

  const slides = useMemo<DirectionSlide[]>(() => {
    if (isKids) {
      return KIDS_SLIDES.map((slide, index) => ({
        id: index + 1,
        ...slide,
        ...buildDirectionTheme(index === 0 ? KIDS_SAGE : "#d4a84b"),
      }));
    }

    const schoolSlides: DirectionSlide[] = directions.map((direction, index) => {
      const theme = buildDirectionTheme(getSchoolColor(direction.key, index));
      const course = SCHOOL_COURSE_PAGES[direction.key];
      return {
        id: index + 1,
        key: direction.key,
        title: direction.title,
        description: direction.description,
        image: `/media/directions/${index + 1}.webp`,
        tag: "Направление",
        tagline: SCHOOL_TAGLINE,
        stat: "8 путей мастерства",
        href: course?.href ?? "/tariffs",
        cta: course?.cta ?? "Подробнее",
        personaHref: "#rpg",
        ...theme,
      };
    });

    const reconTheme = buildDirectionTheme("#8a7048");
    return [
      ...schoolSlides,
      {
        id: schoolSlides.length + 1,
        key: "reconstruction",
        title: "Реконструкция",
        description:
          "Седьмое направление — историческая реконструкция. Четыре трека ниже пока макеты: названия и тексты уточним.",
        image: "/media/directions/7.webp",
        tag: "Направление",
        tagline: "Не путать с RPG-листом — персонаж живёт внутри школы оружия",
        stat: "4 трека · макет",
        href: "/journal/rekonstrukciya-bez-mifov",
        cta: "Читать черновик",
        reconstruction: true,
        ...reconTheme,
      },
    ];
  }, [isKids]);

  const { activeRoom, goToRoom } = useRoomsScroll(containerRef, trackRef, slides.length, undefined, isMobile);

  useEffect(() => {
    goToRoom(0);
  }, [isKids, goToRoom]);

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
  }, [slides.length]);

  return (
    <section id="directions" ref={containerRef} className="relative h-screen">
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
              shouldLoadMedia={Math.abs(i - activeRoom) <= 2}
              showDecor={!isMobile}
            />
          ))}
        </div>

        <ArrowButton
          label="Предыдущее направление"
          direction="prev"
          disabled={activeRoom <= 0}
          onClick={() => goToRoom(activeRoom - 1)}
        />
        <ArrowButton
          label="Следующее направление"
          direction="next"
          disabled={activeRoom >= slides.length - 1}
          onClick={() => goToRoom(activeRoom + 1)}
        />

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
    <div className={`room-panel${isMontante ? " room-panel--montante" : ""}`} style={{ background: "var(--mos-bg)" }}>
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
                decoding="async"
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
              decoding="async"
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
          <p className="room-panel-tagline mb-4 max-w-lg font-light italic text-white/60">{slide.tagline}</p>
          <p className="room-panel-description mb-6 max-w-md leading-relaxed text-white/50">{slide.description}</p>
          {slide.tracks ? (
            <ul className="recon-tracks mb-8">
              {slide.tracks.map((track) => (
                <li key={track.id} className="recon-track">
                  <strong>{track.title}</strong>
                </li>
              ))}
            </ul>
          ) : slide.reconstruction ? (
            <ul className="recon-tracks mb-8">
              {RECONSTRUCTION_TRACKS.map((track) => (
                <li key={track.id} className="recon-track">
                  <span className="recon-track-badge">Макет</span>
                  <strong>{track.title}</strong>
                  <span>{track.description}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: slide.color }}>
            <span>◆</span>
            <span>{slide.stat}</span>
          </div>
          <div className="h-px max-w-24 flex-1" style={{ background: `${slide.color}40` }} />
          {slide.personaHref ? (
            <a href={slide.personaHref} className="text-xs uppercase tracking-[0.12em] text-white/55 hover:text-mos-amber">
              Персонаж направления
            </a>
          ) : null}
          <Button
            href={slide.href}
            variant="filled"
            size="sm"
            className="shrink-0 uppercase"
            style={buildServiceButtonTheme(slide.color)}
          >
            {slide.cta}
          </Button>
        </div>
      </div>
    </div>
  );
}
