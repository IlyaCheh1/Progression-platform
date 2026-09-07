"use client";

import { useRef } from "react";
import Link from "next/link";
import Button from "@/components/ui/button";
import { useAudience } from "@/hooks/landing/useAudience";
import { useRevealFade } from "@/hooks/landing/useRevealFade";
import { LANDING_PROMOS } from "@/lib/landing/promos";
import { withAudience } from "@/lib/audience";

export default function Promos() {
  const sectionRef = useRef<HTMLElement>(null);
  const { mode, isKids } = useAudience();
  useRevealFade(sectionRef);
  const items = isKids ? LANDING_PROMOS.filter((item) => item.id !== "family") : LANDING_PROMOS;

  return (
    <section id="akcii" ref={sectionRef} className="relative py-24" style={{ background: "var(--void)" }}>
      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <div className="reveal-fade mb-12 text-center">
          <span className="mb-3 block text-xs font-semibold uppercase tracking-[0.12em] text-mos-amber">Акции</span>
          <h2 className="font-unbounded text-[calc(2.25rem-2pt)] font-medium text-white md:text-5xl">
            Сейчас в школе
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {items.map((promo, index) => (
            <article
              key={promo.id}
              className="promo-card reveal-fade"
              style={{ transitionDelay: `${index * 0.05}s` }}
            >
              <span className="promo-card-badge">{promo.badge}</span>
              <h3 className="mt-4 font-unbounded text-xl text-white">{promo.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/55">{promo.teaser}</p>
              <Link href={withAudience(promo.href, mode)} className="mt-5 inline-flex text-xs uppercase tracking-[0.12em] text-mos-amber">
                Подробнее
              </Link>
            </article>
          ))}
        </div>
        <div className="reveal-fade mt-10 flex justify-center">
          <Button href={withAudience("/akcii", mode)} variant="stroke" size="md" className="uppercase">
            Все акции
          </Button>
        </div>
      </div>
    </section>
  );
}
