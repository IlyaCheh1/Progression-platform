"use client";

import { useRef } from "react";
import { useAudience } from "@/hooks/landing/useAudience";
import { useRevealFade } from "@/hooks/landing/useRevealFade";
import { KIDS_SAGE, KIDS_WUSHU } from "@/lib/landing/kids-wushu";
import { LANDING_TRAINERS } from "@/screens/landing/landing-trainers";

export default function Trainers() {
  const sectionRef = useRef<HTMLElement>(null);
  const { isKids } = useAudience();
  const trainers = isKids
    ? LANDING_TRAINERS.filter((trainer) => trainer.id === "tatyana-gribanova").map((trainer) => ({
        ...trainer,
        role: KIDS_WUSHU.section,
        bio: [KIDS_WUSHU.body, KIDS_WUSHU.age],
        accent: KIDS_SAGE,
      }))
    : LANDING_TRAINERS;
  useRevealFade(sectionRef, 0.12, isKids);

  return (
    <section id="trainers" ref={sectionRef} className="relative overflow-x-clip py-24" style={{ background: "var(--void)" }}>
      <div
        className="pointer-events-none absolute left-1/2 top-1/4 h-[480px] w-[480px] -translate-x-1/2 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(212,168,75,0.06) 0%, transparent 70%)" }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <div className="reveal-fade mb-14 text-center md:mb-16">
          <span
            className="mb-3 block font-golos text-xs font-semibold uppercase tracking-[0.12em]"
            style={{ color: "var(--mos-amber)" }}
          >
            {isKids ? KIDS_WUSHU.section : "Команда школы"}
          </span>
          <h2 className="font-unbounded text-[calc(2.25rem-2pt)] font-medium tracking-[0.06em] text-white md:text-5xl">
            {isKids ? (
              <>
                Тренер <span style={{ color: KIDS_SAGE }}>{KIDS_WUSHU.trainerShort}</span>
              </>
            ) : (
              <>
                Наши <span style={{ color: "#f0c35a" }}>мастера</span>
              </>
            )}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {trainers.map((trainer, index) => (
            <article
              key={trainer.id}
              className="trainer-card reveal-fade group overflow-hidden rounded-[28px] bg-white/[0.03] backdrop-blur-xl"
              style={{ transitionDelay: `${index * 0.06}s`, ["--trainer-accent" as string]: trainer.accent }}
            >
              <div className="trainer-card-photo relative aspect-[16/10] overflow-hidden sm:aspect-[5/3]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={trainer.photo}
                  alt={trainer.name}
                  className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                />
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background: `linear-gradient(180deg, transparent 35%, rgba(11,11,12,0.92) 100%), radial-gradient(circle at 20% 0%, ${trainer.accent}22 0%, transparent 55%)`,
                  }}
                  aria-hidden
                />
              </div>

              <div className="p-6 md:p-7">
                <div className="mb-4">
                  <h3 className="font-unbounded text-lg font-medium text-white md:text-xl">{trainer.name}</h3>
                  <p
                    className="mt-1 font-golos text-[calc(0.75rem-2pt)] uppercase tracking-[0.08em] md:text-xs"
                    style={{ color: trainer.accent }}
                  >
                    {trainer.role}
                  </p>
                </div>

                <div className="space-y-3">
                  {trainer.bio.map((paragraph) => (
                    <p key={paragraph} className="font-golos text-[calc(0.875rem-2pt)] leading-relaxed text-white/55 md:text-sm">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
