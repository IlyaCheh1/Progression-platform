"use client";

import { useEffect, useRef } from "react";

const RPG_BENEFITS = [
  {
    id: "1",
    color: "#d4a84b",
    tag: "Зал",
    title: "Тренируешься",
    description: "Посещай тренировки, выполняй задания, участвуй в мероприятия",
  },
  {
    id: "2",
    color: "#c45c2a",
    tag: "XP",
    title: "Получаешь опыт",
    description: "Каждая тренировка или задание школы приносит опыт",
  },
  {
    id: "3",
    color: "#5a8f7b",
    tag: "Уровни",
    title: "Прокачиваешь персонажа",
    description: "Достигни 100 уровня и освой все 8 оружейных путей мастерства.",
  },
  {
    id: "4",
    color: "#5c7d99",
    tag: "Награды",
    title: "Открываешь достижения",
    description: "Тиры, печати рангов, квесты и титулы зала.",
  },
] as const;

export default function RpgBlock() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("visible")),
      { threshold: 0.1 },
    );
    sectionRef.current?.querySelectorAll(".reveal-fade").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="rpg" ref={sectionRef} className="relative z-10 overflow-x-clip px-6 py-24">
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(212,168,75,0.08) 0%, transparent 70%)" }}
      />

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="caps-intro-shell relative mb-16 overflow-visible">
          <div className="reveal-fade overflow-visible text-center">
            <span
              className="mb-3 block text-xs font-semibold uppercase tracking-[0.12em]"
              style={{ color: "var(--mos-amber)" }}
            >
              Прогрессия школы
            </span>
            <h2 className="mb-4 font-unbounded text-[calc(2.25rem-2pt)] font-medium text-white md:text-6xl">
              RPG-<span style={{ color: "#f0c35a" }}>персонаж</span>
            </h2>
            <p className="mx-auto max-w-2xl text-[calc(1rem-2pt)] leading-relaxed text-white/40 md:text-base">
              Логика прогрессии как в игре — но опыт приходит из реального зала.
            </p>
          </div>

          <div className="reveal-fade mb-10 mt-10 md:mb-12 md:mt-12">
            <h3 className="text-center font-unbounded text-[calc(1.125rem-2pt)] font-medium text-white md:text-xl">
              Как это работает?
            </h3>
          </div>
        </div>

        <div className="caps-benefits-shell reveal-fade relative mt-16 md:mt-20">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {RPG_BENEFITS.map((benefit, index) => (
              <div
                key={benefit.id}
                className="caps-benefit-card reveal-fade rounded-3xl p-5 md:p-6"
                style={{
                  transitionDelay: `${index * 0.05}s`,
                  ["--benefit-color" as string]: benefit.color,
                }}
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <span
                    className="caps-benefit-number font-unbounded text-xl font-medium"
                    style={{ color: "rgba(255,255,255,0.15)" }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span
                    className="caps-benefit-tag shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold"
                    style={{
                      background: `${benefit.color}15`,
                      color: benefit.color,
                      border: `1px solid ${benefit.color}30`,
                    }}
                  >
                    {benefit.tag}
                  </span>
                </div>

                <h4 className="mb-2 font-unbounded text-[calc(0.875rem-2pt)] font-semibold text-white md:text-base">
                  {benefit.title}
                </h4>
                <p className="text-[calc(0.75rem-2pt)] leading-relaxed text-white/50 md:text-sm">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
