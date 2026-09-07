"use client";

import { useRef } from "react";
import Button from "@/components/ui/button";
import { useAudience } from "@/hooks/landing/useAudience";
import { useRevealFade } from "@/hooks/landing/useRevealFade";
import { withAudience } from "@/lib/audience";
import { HALL_RENTAL_FACTS, HALL_RENTAL_PHOTOS } from "@/lib/landing/hall-rental";

const FACTS = [
  { label: "Цена", value: HALL_RENTAL_FACTS.price },
  { label: "Площадь", value: HALL_RENTAL_FACTS.area },
  { label: "Зеркала", value: HALL_RENTAL_FACTS.mirrors },
  { label: "Покрытие", value: HALL_RENTAL_FACTS.floor },
] as const;

export default function Arenda() {
  const sectionRef = useRef<HTMLElement>(null);
  const { mode } = useAudience();
  useRevealFade(sectionRef);

  return (
    <section id="arenda" ref={sectionRef} className="relative py-24" style={{ background: "var(--void)" }}>
      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <div className="reveal-fade mb-10 text-center">
          <span className="mb-3 block text-xs font-semibold uppercase tracking-[0.12em] text-mos-amber">
            Аренда зала
          </span>
          <h2 className="font-unbounded text-[calc(2.25rem-2pt)] font-medium text-white md:text-5xl">
            Зал на час — под вашу группу
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/50">
            80 м², зеркала и покрытие «ласточкин хвост». Ниже — виды зала: зеркала, окна в пол и пространство под тренировку.
          </p>
        </div>

        <ul className="reveal-fade grid grid-cols-2 gap-3 md:grid-cols-4">
          {FACTS.map((fact) => (
            <li key={fact.label} className="promo-card p-4">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-mos-amber">{fact.label}</p>
              <p className="mt-2 font-unbounded text-base text-white md:text-lg">{fact.value}</p>
            </li>
          ))}
        </ul>

        <div className="reveal-fade mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {HALL_RENTAL_PHOTOS.map((photo) => (
            <figure key={photo.src} className="hall-photo-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.src} alt={photo.alt} className="h-full w-full object-cover object-center" />
              <figcaption>{photo.caption}</figcaption>
            </figure>
          ))}
        </div>

        <div className="reveal-fade mt-10 flex justify-center">
          <Button href={withAudience("/arenda#zayavka", mode)} variant="primary" size="lg" className="uppercase">
            Оставить заявку
          </Button>
        </div>
      </div>
    </section>
  );
}
