"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { directions } from "@/lib/content";
import { SCHOOL_COURSE_PAGES } from "@/lib/courses/data";
import { getSchoolColor } from "@/lib/school-colors";
import { getSchoolIconSrc } from "@/lib/school-icons";
import { useCenteredListItem } from "@/hooks/landing/useCenteredListItem";
import { useMobileMedia } from "@/hooks/landing/useMobileMedia";
import { useScrollDirection } from "@/hooks/landing/useScrollDirection";

type TrainingMode = "group" | "solo";

type TrainingExperience = {
  key: string;
  number: string;
  name: string;
  category: string;
  description: string;
  color: string;
  icon: string;
  href: string;
};

const MODE_COLORS: Record<TrainingMode, string> = {
  group: "#d4a84b",
  solo: "#c45c2a",
};

const MODE_INTRO: Record<TrainingMode, string> = {
  group: "Занятия в группе: ритм зала, партнёрская работа и общий прогресс школы.",
  solo: "Персональный разбор техники с тренером и ускоренная коррекция ошибок.",
};

const MODE_CATEGORY: Record<TrainingMode, string> = {
  group: "Группа",
  solo: "Индивидуально",
};

function buildExperiences(mode: TrainingMode): TrainingExperience[] {
  return directions.map((direction, index) => ({
    key: direction.key,
    number: String(index + 1).padStart(2, "0"),
    name: direction.title,
    category: MODE_CATEGORY[mode],
    description:
      mode === "group"
        ? `${direction.description} Формат зала: совместные упражнения, спarring и общий RPG-прогресс.`
        : `${direction.description} Персональный трек с тренером, гибкий график и точечная коррекция.`,
    color: getSchoolColor(direction.key, index),
    icon: getSchoolIconSrc(direction.key),
    href: SCHOOL_COURSE_PAGES[direction.key]?.href ?? "#tariffs",
  }));
}

function modeTitleStyle(mode: TrainingMode, activeMode: TrainingMode, hoveredMode: TrainingMode | null): CSSProperties {
  const isActive = activeMode === mode;
  const isHovered = hoveredMode === mode;
  const accent = MODE_COLORS[mode];

  return {
    color: isActive || isHovered ? accent : "rgba(255,255,255,0.35)",
    textShadow: isHovered ? `0 0 48px color-mix(in srgb, ${accent} 55%, transparent)` : "none",
  };
}

function SchoolIcon({ src, active }: { src: string; active: boolean }) {
  return (
    <div className="exp-school-icon flex h-full w-full items-center justify-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        aria-hidden
        className={`h-full w-auto max-w-full object-contain transition-all duration-300 ${
          active ? "grayscale-0 opacity-100" : "grayscale opacity-45"
        }`}
        draggable={false}
        loading="lazy"
      />
    </div>
  );
}

export default function Services() {
  const sectionRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [mode, setMode] = useState<TrainingMode>("group");
  const [hoveredMode, setHoveredMode] = useState<TrainingMode | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tappedIndex, setTappedIndex] = useState<number | null>(null);
  const centeredIndexRef = useRef<number | null>(null);
  const isMobile = useMobileMedia();
  const scrollDirection = useScrollDirection(isMobile);
  const centeredIndex = useCenteredListItem(listRef, ".experience-item", isMobile, mode, {
    measureSelector: "[data-exp-header]",
    scrollDirection,
  });
  const mobileActiveIndex = tappedIndex ?? centeredIndex;
  const experiences = buildExperiences(mode);

  useEffect(() => {
    if (!isMobile) return;
    if (centeredIndex !== centeredIndexRef.current) {
      centeredIndexRef.current = centeredIndex;
      setTappedIndex(null);
    }
  }, [centeredIndex, isMobile]);

  useEffect(() => {
    setHoveredIndex(null);
    setTappedIndex(null);
    centeredIndexRef.current = null;

    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      },
      { threshold: 0.05 },
    );

    section.querySelectorAll(".reveal-fade").forEach((el) => observer.observe(el));

    const sectionRect = section.getBoundingClientRect();
    const isInView = sectionRect.top < window.innerHeight && sectionRect.bottom > 0;
    if (isInView) {
      section.querySelectorAll(".reveal-fade").forEach((el) => {
        el.classList.add("visible");
      });
    }

    return () => observer.disconnect();
  }, [mode]);

  return (
    <section id="services" ref={sectionRef} className="relative px-6 py-24" style={{ background: "var(--void)" }}>
      <div className="mx-auto max-w-6xl">
        <div className="reveal-fade experiences-header mb-16">
          <span
            className="experiences-header-eyebrow text-xs font-semibold uppercase tracking-[0.12em]"
            style={{ color: "var(--mos-amber)" }}
          >
            Выбери свой формат
          </span>
          <div className="experiences-header-titles mt-3 flex flex-col gap-6">
            <div className="flex flex-col gap-5 md:gap-7">
              <button
                type="button"
                onClick={() => setMode("group")}
                onMouseEnter={() => setHoveredMode("group")}
                onMouseLeave={() => setHoveredMode(null)}
                className="block cursor-pointer border-0 bg-transparent p-0 text-left font-unbounded text-[calc(2.25rem-2pt)] font-medium leading-tight transition-all duration-300 md:text-6xl"
                style={modeTitleStyle("group", mode, hoveredMode)}
              >
                Групповые
              </button>
              <button
                type="button"
                onClick={() => setMode("solo")}
                onMouseEnter={() => setHoveredMode("solo")}
                onMouseLeave={() => setHoveredMode(null)}
                className="block cursor-pointer border-0 bg-transparent p-0 text-left font-unbounded text-[calc(2.25rem-2pt)] font-medium leading-tight transition-all duration-300 md:text-6xl"
                style={modeTitleStyle("solo", mode, hoveredMode)}
              >
                Индивидуальные
              </button>
            </div>
            <p
              key={mode}
              className="experiences-mode-intro max-w-xl text-sm leading-relaxed text-white/50 md:text-base"
            >
              {MODE_INTRO[mode]}
            </p>
          </div>
        </div>

        <ul key={mode} ref={listRef} className="space-y-0">
          {experiences.map((exp, i) => {
            const isActive = isMobile ? mobileActiveIndex === i : hoveredIndex === i;
            const expandDirection = scrollDirection === "up" ? "expand-from-top" : "expand-from-down";
            const itemClassName = `experience-item group rounded-lg px-6 py-6 transition-all duration-300${
              isMobile && isActive ? ` is-centered ${expandDirection}` : ""
            }`;
            const itemStyle = { ["--service-color" as string]: exp.color };
            const itemHandlers = isMobile
              ? {}
              : {
                  onMouseEnter: () => setHoveredIndex(i),
                  onMouseLeave: () => setHoveredIndex(null),
                };

            return (
              <li key={`${mode}-${exp.number}`}>
                <Link href={exp.href} className={itemClassName} style={itemStyle} {...itemHandlers}>
                  <div className="experience-item-row">
                    <div className="exp-item-grid">
                      <span
                        className="exp-number w-10 shrink-0 font-unbounded text-[calc(1.5rem-2pt)] font-medium tabular-nums leading-none transition-colors duration-300 md:text-2xl"
                        style={{ color: isActive ? exp.color : "rgba(255,255,255,0.15)" }}
                      >
                        {exp.number}
                      </span>

                      <div className="exp-icon-wrap">
                        <SchoolIcon src={exp.icon} active={isActive} />
                      </div>

                      <div data-exp-header className="exp-header-wrap min-w-0">
                        <div className="flex items-center justify-between gap-4 md:gap-6">
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <h3
                              data-exp-title
                              className="font-unbounded text-[calc(1.25rem-2pt)] font-bold leading-none transition-colors duration-300 md:text-2xl"
                              style={{ color: isActive ? exp.color : "white" }}
                            >
                              {exp.name}
                            </h3>
                            <span
                              className="hidden shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold md:inline-flex"
                              style={{
                                background: `${exp.color}15`,
                                color: exp.color,
                                border: `1px solid ${exp.color}30`,
                              }}
                            >
                              {exp.category}
                            </span>
                          </div>

                          <div
                            className="exp-arrow flex h-8 w-8 shrink-0 items-center justify-center rounded-full opacity-0 transition-all duration-300 md:-translate-x-4"
                            style={{ background: exp.color }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
                              <path
                                d="M5 12h14M12 5l7 7-7 7"
                                stroke="white"
                                strokeWidth="2"
                                fill="none"
                                strokeLinecap="round"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>

                      <div className="exp-description-panel">
                        <p className="exp-description text-sm leading-relaxed text-white/40">{exp.description}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
