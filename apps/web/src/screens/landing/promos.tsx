"use client";

import { useRef } from "react";
import Link from "next/link";
import { useAudience } from "@/hooks/landing/useAudience";
import { useRevealFade } from "@/hooks/landing/useRevealFade";
import { LANDING_PROMOS } from "@/lib/landing/promos";
import { withAudience } from "@/lib/audience";
import { cn } from "@/lib/utils";

export default function Promos() {
  const sectionRef = useRef<HTMLElement>(null);
  const { mode, isKids } = useAudience();
  useRevealFade(sectionRef);
  const items = isKids ? LANDING_PROMOS.filter((item) => item.showOnKids) : LANDING_PROMOS;

  return (
    <section id="akcii" ref={sectionRef} className="relative py-16 md:py-24" style={{ background: "var(--void)" }}>
      <div className="relative z-10 mx-auto max-w-6xl px-4 md:px-6">
        <div className="landing-frame">
          <div className="landing-frame-head reveal-fade">
            <h2 className="font-unbounded text-3xl tracking-[0.12em] md:text-5xl">Акции</h2>
            <Link href={withAudience("/akcii", mode)} className="landing-frame-link">
              Все акции
            </Link>
          </div>
          <div className={cn("promo-mosaic", items.length < 3 && "promo-mosaic-pair")}>
            {items.map((promo) => (
              <article key={promo.id} className={cn("promo-tile reveal-fade", promo.featured && "promo-tile-feature")}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={promo.image} alt="" />
                <div className="promo-tile-shade" aria-hidden />
                <span className="promo-tile-badge">{promo.badge}</span>
                <div className="promo-tile-body">
                  <h3 className="font-unbounded text-2xl text-white md:text-3xl">{promo.title}</h3>
                  <p className="max-w-xl text-sm leading-relaxed text-white/80">{promo.teaser}</p>
                  <Link href={withAudience(`/akcii/${promo.slug}`, mode)} className="promo-tile-more">
                    Подробнее
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
