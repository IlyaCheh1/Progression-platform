"use client";

import { useRef } from "react";
import { useRevealFade } from "@/hooks/landing/useRevealFade";

type Trainer = {
  id: string;
  name: string;
  role: string;
  bio: string[];
  photo: string;
  accent: string;
};

const TRAINERS: Trainer[] = [
  {
    id: "max-kiselev",
    name: "Макс Киселев",
    role: "Автор методик, исследователь, переводчик, лектор, тренер",
    bio: [
      "Автор методик обучения, исследователь, переводчик, лектор и, конечно, тренер по фехтованию.",
      "Опыт в фехтовании больше 15 лет, опыт в преподавании — больше 10 лет.",
    ],
    photo: "/media/trainers/max-kiselev.jpg",
    accent: "#d4a84b",
  },
  {
    id: "nikolay-lobanov",
    name: "Николай Лобаев",
    role: "Ведьмак, Итальянская рапира",
    bio: [
      "Тренер курсов «Ведьмак» и «Итальянская рапира». Курс по итальянской рапире полностью построен на его исследованиях трактатов мастеров XVII века.",
      "Двукратный чемпион Москвы и чемпион России по арт-фехтованию, кандидат в мастера спорта. Один из первых выпускников нашей школы, тренерский опыт с 2021 года. Также ведёт курсы по длинному и одноручному мечу XV–XVI века.",
    ],
    photo: "/media/trainers/nikolay-lobanov.jpg",
    accent: "#c45c2a",
  },
  {
    id: "tatyana-gribanova",
    name: "Татьяна Грибанова",
    role: "Ушу, «Клинки Востока»",
    bio: [
      "Мастер ушу и тренер направления «Клинки Востока».",
      "Многократный призёр и чемпион различных соревнований по ушу. Опыт в преподавании — больше 10 лет.",
    ],
    photo: "/media/trainers/tatyana-gribanova.jpg",
    accent: "#5a8f7b",
  },
  {
    id: "ivan-bobrovsky",
    name: "Иван Бобровский",
    role: "Иберийский двуручный меч, испанская рапира, наваха",
    bio: ["Тренер по иберийскому двуручному мечу, испанской рапире и навахе."],
    photo: "/media/trainers/ivan-bobrovsky.jpg",
    accent: "#5c7d99",
  },
];

export default function Trainers() {
  const sectionRef = useRef<HTMLElement>(null);
  useRevealFade(sectionRef);

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
            Команда школы
          </span>
          <h2 className="font-unbounded text-[calc(2.25rem-2pt)] font-medium tracking-[0.06em] text-white md:text-5xl">
            Наши <span style={{ color: "#f0c35a" }}>мастера</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {TRAINERS.map((trainer, index) => (
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
