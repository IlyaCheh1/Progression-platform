"use client";

import { useRef, useState } from "react";
import Button from "@/components/ui/button";
import { useAudience } from "@/hooks/landing/useAudience";
import { useRevealFade } from "@/hooks/landing/useRevealFade";
import { withAudience } from "@/lib/audience";
import { HallChipRow, HallFilmstrip } from "@/components/hall-rental-media";
import { HALL_RENTAL_HALLS } from "@/lib/landing/hall-rental";

function mobileSpecLine(spec: { label: string; value: string }) {
  const digits = spec.value.replace(/\s/g, "").match(/\d+/)?.[0] ?? spec.value;
  const label = spec.label === "Площадь" ? "площадь" : spec.label;
  return `${label}: ${digits}`;
}

export default function Arenda() {
  const sectionRef = useRef<HTMLElement>(null);
  const { mode } = useAudience();
  const [hallId, setHallId] = useState<(typeof HALL_RENTAL_HALLS)[number]["id"]>("ushu");
  useRevealFade(sectionRef);

  const hall = HALL_RENTAL_HALLS.find((item) => item.id === hallId) ?? HALL_RENTAL_HALLS[0];

  return (
    <section id="arenda" ref={sectionRef} className="relative py-16 md:py-24" style={{ background: "var(--void)" }}>
      <div className="relative z-10 mx-auto max-w-6xl px-4 md:px-6">
        <div className="landing-frame">
        <div className="hall-rental-top reveal-fade">
          <div className="hall-rental-lead">
            <h2 className="font-unbounded text-[calc(2.25rem-2pt)] font-medium md:text-5xl">Аренда зала</h2>
            <HallChipRow hallId={hall.id} onChange={setHallId} controls="hall-spec" />
          </div>

          <div
            id="hall-spec"
            role="tabpanel"
            aria-labelledby={`hall-tab-${hall.id}`}
            className="hall-spec promo-card"
          >
            <ul className="flex flex-col gap-2">
              {hall.specs.map((spec) => (
                <li key={spec.label} className="hall-spec-row flex items-baseline justify-between gap-4">
                  <span className="hall-spec-full text-[0.62rem] font-bold uppercase tracking-[0.14em] text-white/45">{spec.label}</span>
                  <span className="hall-spec-full text-right font-unbounded text-sm text-white md:text-base">{spec.value}</span>
                  <span className="hall-spec-short font-golos">{mobileSpecLine(spec)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <HallFilmstrip key={hall.id} photos={HALL_RENTAL_HALLS[0].photos} peek />

        <div className="reveal-fade mt-10 flex justify-center">
          <Button href={withAudience("/arenda#zayavka", mode)} variant="primary" size="lg" className="uppercase">
            Оставить заявку
          </Button>
        </div>
        </div>
      </div>
    </section>
  );
}

