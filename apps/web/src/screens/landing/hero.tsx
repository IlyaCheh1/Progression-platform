"use client";

import { useState } from "react";
import Button from "@/components/ui/button";
import { useAudience } from "@/hooks/landing/useAudience";
import { KIDS_WUSHU } from "@/lib/landing/kids-wushu";
import TariffPurchase from "@/screens/landing/tariff-purchase";

function HeroFoot({ hidden = false }: { hidden?: boolean }) {
  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-2 pb-6 text-center" aria-hidden={hidden || undefined}>
      <p className="font-golos text-[calc(0.875rem+2pt)] font-medium leading-relaxed text-white/60 md:text-[calc(0.875rem+4pt)]">
        {KIDS_WUSHU.lead}
        <br />
        {KIDS_WUSHU.cta}
      </p>
      <div className="relative h-12 w-px overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
        <div
          className="absolute top-0 h-4 w-full animate-bounce"
          style={{ background: "linear-gradient(to bottom, var(--mos-amber), transparent)" }}
        />
      </div>
    </div>
  );
}

export default function Hero() {
  const { isKids } = useAudience();
  const [open, setOpen] = useState(false);

  if (!isKids) return null;

  return (
    <section id="hero" className="kids-hero relative h-dvh min-h-[32rem] w-full overflow-hidden" style={{ background: "var(--void)" }}>
      <div className="absolute inset-0" aria-hidden>
        <picture>
          <source media="(max-width: 767px)" srcSet={KIDS_WUSHU.media.heroMobile} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={KIDS_WUSHU.media.heroDesktop}
            alt=""
            className="kids-hero-art h-full w-full object-cover"
            decoding="async"
            fetchPriority="high"
          />
        </picture>
      </div>

      <div className="video-overlay pointer-events-none absolute inset-0" style={{ zIndex: 2 }} />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          zIndex: 2,
          background:
            "radial-gradient(ellipse at 18% 40%, rgba(90,143,123,0.28) 0%, transparent 58%), radial-gradient(ellipse at 82% 48%, rgba(212,168,75,0.22) 0%, transparent 60%)",
        }}
      />

      <div className="hero-main relative z-10 flex h-full flex-col items-center px-6 text-center">
        <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center">
          <span className="kids-age-ribbon">{KIDS_WUSHU.age}</span>
        </div>
        <div className="min-h-0 w-full flex-1" />
        <HeroFoot />
      </div>
      <div className="kids-hero-stage">
        <div className="kids-hero-stage-grow" />
        <h1
          className="kids-hero-title mobile-fluid-hero-title font-unbounded font-medium tracking-tight"
          style={{ textShadow: "0 0 60px rgba(212,168,75,0.28)" }}
        >
          {KIDS_WUSHU.school}
        </h1>
        <div className="kids-hero-stage-lower">
          <div className="kids-hero-stage-grow" />
          <Button type="button" variant="primary" size="lg" data-kids-join onClick={() => setOpen(true)}>
            Присоединиться
          </Button>
          <div className="kids-hero-stage-grow" />
          <HeroFoot hidden />
        </div>
      </div>
      {open ? <TariffPurchase tariffId="trial" onClose={() => setOpen(false)} /> : null}
    </section>
  );
}
