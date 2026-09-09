"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import HeroVideoBackdrop from "@/components/hero-video-backdrop";
import Button from "@/components/ui/button";
import { useMobileMedia } from "@/hooks/landing/useMobileMedia";
import { useRoomsScroll } from "@/hooks/landing/useRoomsScroll";
import {
  ADULT_COURSE_SLIDES,
  ADULT_SCHOOL_SLIDE,
  ADULT_SCHOOL_VIDEO,
  courseEnrollHref,
  coursePageHref,
  type AdultCourseSlide,
} from "@/lib/landing/adult-directions";
import { buildServiceButtonTheme } from "@/lib/service-button-theme";

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

type SchoolSlideView = {
  kind: "school";
  key: "school";
  title: string;
  titleAccent: string;
  lead: string;
  directions: string;
  arsenal: string;
  cta: string;
  color: string;
  glow: string;
  gradient: string;
  gradientMobile: string;
};

type CourseSlideView = AdultCourseSlide & {
  kind: "course";
  href: string;
  enrollHref: string;
  glow: string;
  gradient: string;
  gradientMobile: string;
};

type DirectionSlideView = SchoolSlideView | CourseSlideView;

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
  const [reduceMotion, setReduceMotion] = useState(false);
  const [mountedSlides, setMountedSlides] = useState(() => new Set([0, 1]));
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());

  const slides = useMemo<DirectionSlideView[]>(() => {
    const schoolTheme = buildDirectionTheme("#d4a84b");
    const school: SchoolSlideView = {
      kind: "school",
      key: "school",
      title: ADULT_SCHOOL_SLIDE.title,
      titleAccent: ADULT_SCHOOL_SLIDE.titleAccent,
      lead: ADULT_SCHOOL_SLIDE.lead,
      directions: ADULT_SCHOOL_SLIDE.directions,
      arsenal: ADULT_SCHOOL_SLIDE.arsenal,
      cta: ADULT_SCHOOL_SLIDE.cta,
      ...schoolTheme,
    };

    const courses: CourseSlideView[] = ADULT_COURSE_SLIDES.map((slide) => ({
      ...slide,
      kind: "course",
      href: coursePageHref(slide.courseSlug),
      enrollHref: courseEnrollHref(slide.courseSlug),
      ...buildDirectionTheme(slide.color),
    }));

    return [school, ...courses];
  }, []);

  const { activeRoom, goToRoom } = useRoomsScroll(containerRef, trackRef, slides.length, undefined, isMobile);

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
    const next = (activeRoom + 1) % slides.length;
    setMountedSlides((prev) => {
      const nextSet = new Set(prev);
      nextSet.add(activeRoom);
      nextSet.add(next);
      if (nextSet.size > 3) {
        return new Set([activeRoom, next, (activeRoom + slides.length - 1) % slides.length]);
      }
      return nextSet;
    });
  }, [activeRoom, slides.length]);

  useEffect(() => {
    if (reduceMotion) return;
    const next = (activeRoom + 1) % slides.length;
    videoRefs.current.forEach((video, index) => {
      if (index === activeRoom || index === next) {
        void video.play().catch(() => {});
        return;
      }
      video.pause();
    });
  }, [activeRoom, mountedSlides, reduceMotion, slides.length]);

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
    <section id="directions" ref={containerRef} className="relative h-dvh min-h-[32rem]">
      <div className="rooms-sticky sticky top-0 h-dvh min-h-[32rem] w-full overflow-hidden">
        {activeRoom > 0 ? (
          <div className="rooms-index absolute left-1/2 z-20 hidden -translate-x-1/2 items-center gap-3 text-xs font-semibold uppercase tracking-widest text-white/40 md:flex">
            <span>Направления</span>
            <span className="h-px w-8 bg-white/20" />
            <span style={{ color: "var(--mos-amber)" }}>
              {activeRoom} / {slides.length - 1}
            </span>
          </div>
        ) : null}

        <div ref={trackRef} className="h-scroll-container h-full will-change-transform">
          {slides.map((slide, i) => (
            <DirectionPanel
              key={slide.key}
              slide={slide}
              index={i}
              isActive={i === activeRoom}
              isNext={i === (activeRoom + 1) % slides.length}
              isMounted={mountedSlides.has(i)}
              reduceMotion={reduceMotion}
              registerVideo={registerVideo}
              onOpenCourses={() => goToRoom(1)}
            />
          ))}
        </div>

        <ArrowButton
          label="Предыдущий слайд"
          direction="prev"
          disabled={activeRoom <= 0}
          onClick={() => goToRoom(activeRoom - 1)}
        />
        <ArrowButton
          label="Следующий слайд"
          direction="next"
          disabled={activeRoom >= slides.length - 1}
          onClick={() => goToRoom(activeRoom + 1)}
        />

        {activeRoom > 0 ? (
          <div
            className="rooms-dots absolute left-1/2 z-20 flex -translate-x-1/2 gap-1"
            role="tablist"
            aria-label="Направления"
          >
            {slides.slice(1).map((slide, courseIndex) => {
              const roomIndex = courseIndex + 1;
              return (
                <button
                  key={slide.key}
                  type="button"
                  role="tab"
                  aria-label={slide.title}
                  aria-selected={roomIndex === activeRoom}
                  onClick={() => goToRoom(roomIndex)}
                  className="flex h-10 w-10 cursor-pointer items-center justify-center md:h-6 md:w-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
                >
                  <span
                    className="block h-2 w-2 rounded-full transition-transform duration-300 hover:scale-125"
                    style={{
                      background: roomIndex === activeRoom ? slides[activeRoom].color : "rgba(255,255,255,0.2)",
                      transform: roomIndex === activeRoom ? "scale(1.5)" : "scale(1)",
                    }}
                  />
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function DirectionPanel({
  slide,
  index,
  isActive,
  isNext,
  isMounted,
  reduceMotion,
  registerVideo,
  onOpenCourses,
}: {
  slide: DirectionSlideView;
  index: number;
  isActive: boolean;
  isNext: boolean;
  isMounted: boolean;
  reduceMotion: boolean;
  registerVideo: (index: number, node: HTMLVideoElement | null) => void;
  onOpenCourses: () => void;
}) {
  const comingSoon = slide.kind === "course" && Boolean(slide.comingSoon);

  return (
    <div className={`room-panel${slide.kind === "school" ? " room-panel--school" : ""}`} style={{ background: "var(--mos-bg)" }}>
      <div className="absolute inset-0">
        <HeroVideoBackdrop
          index={index}
          file={slide.kind === "school" ? ADULT_SCHOOL_VIDEO : slide.video}
          isActive={isActive}
          isNext={isNext}
          isMounted={isMounted}
          reduceMotion={reduceMotion}
          registerVideo={registerVideo}
          blurred={comingSoon}
          forceLocal={slide.kind === "school"}
        />
      </div>

      <div className="room-panel-left-vignette absolute inset-0" aria-hidden />
      <div
        className="room-panel-color-mask absolute inset-0"
        style={{ background: slide.gradient, mixBlendMode: "multiply" }}
      />
      <div className="video-overlay absolute inset-0" />

      {slide.kind === "school" ? (
        <SchoolSlideCopy slide={slide} onOpenCourses={onOpenCourses} />
      ) : (
        <CourseSlideCopy slide={slide} comingSoon={comingSoon} />
      )}
    </div>
  );
}

function SchoolSlideCopy({ slide, onOpenCourses }: { slide: SchoolSlideView; onOpenCourses: () => void }) {
  return (
    <div className="school-slide-copy relative z-10 flex h-full flex-col items-center px-6 text-center">
      <div className="flex flex-1 flex-col items-center justify-center">
        <h2
          className="mobile-fluid-hero-title flex max-w-4xl flex-col items-center gap-3 font-unbounded font-medium tracking-tight md:gap-5"
          style={{ textShadow: "0 0 60px rgba(212,168,75,0.28)" }}
        >
          <span className="block text-[1.5em] leading-tight" style={{ color: "var(--color-controlsPrimaryActive)" }}>
            {slide.title}
          </span>
          <span className="block max-w-3xl text-[calc(0.72em+2pt)] text-white leading-tight md:text-[calc(0.55em+2pt)]">
            {slide.titleAccent}
          </span>
        </h2>
        <p className="mt-8 max-w-xl font-golos text-[calc(0.875rem+3pt)] font-medium leading-relaxed text-white/70 md:text-[calc(0.875rem+5pt)]">
          {slide.lead}
        </p>
      </div>
      <div className="flex w-full flex-col items-center gap-6">
        <Button
          type="button"
          variant="primary"
          size="lg"
          className="cta-pulse uppercase"
          onClick={onOpenCourses}
        >
          {slide.cta}
        </Button>
        <div className="school-slide-facts flex w-full items-start justify-between gap-6 font-golos text-[calc(0.75rem+2pt)] font-medium leading-snug text-white/70 md:text-[calc(0.875rem+2pt)]">
          <p className="max-w-[46%] text-left">
            <span aria-hidden>✨ </span>
            {slide.directions}
          </p>
          <p className="max-w-[46%] text-right">
            <span aria-hidden>⚔️ </span>
            {slide.arsenal}
          </p>
        </div>
      </div>
    </div>
  );
}

function CourseSlideCopy({ slide, comingSoon }: { slide: CourseSlideView; comingSoon: boolean }) {
  return (
    <div className="room-panel-text relative z-10 flex h-full max-w-3xl flex-col justify-end px-6 pb-24 md:px-24">
      <div
        className="mb-6 inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
        style={{ background: `${slide.color}22`, color: slide.color }}
      >
        ✦ {comingSoon ? "Скоро" : "Направление"}
      </div>

      <h2
        className="mobile-fluid-room-title mb-4 font-unbounded font-medium md:text-[calc(4.5rem-3px)] lg:text-[calc(6rem-3px)]"
        style={{ color: slide.color, textShadow: `0 0 60px ${slide.glow}` }}
      >
        {slide.title}
      </h2>

      <div className="room-panel-middle">
        <p className="room-panel-description mb-6 max-w-md leading-relaxed text-white/50">{slide.description}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button href={slide.href} variant="stroke" size="sm" className="shrink-0 uppercase">
          Описание курса
        </Button>
        <Button
          href={slide.enrollHref}
          variant="filled"
          size="sm"
          className="shrink-0 uppercase"
          style={buildServiceButtonTheme(slide.color)}
        >
          Записаться
        </Button>
      </div>
    </div>
  );
}
