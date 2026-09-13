"use client";

import { useAudience } from "@/hooks/landing/useAudience";
import { KIDS_WUSHU } from "@/lib/landing/kids-wushu";

export default function Hero() {
  const { isKids } = useAudience();

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

      <div className="hero-main relative z-10 flex h-full flex-col items-center justify-center px-6 pb-28 text-center">
        <div className="flex w-full flex-col items-center gap-8 md:gap-10">
          <h1
            className="mobile-fluid-hero-title flex max-w-4xl flex-col items-center gap-4 font-unbounded font-medium tracking-tight md:gap-6 lg:gap-7"
            style={{ textShadow: "0 0 60px rgba(212,168,75,0.28)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={KIDS_WUSHU.media.logo} alt="" className="kids-hero-mark" />
            <span className="block text-white leading-tight">{KIDS_WUSHU.school}</span>
          </h1>
          <span className="kids-age-ribbon">{KIDS_WUSHU.age}</span>
        </div>
      </div>

      <div className="hero-bottom-copy absolute left-1/2 z-10 flex w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 flex-col items-center gap-2 px-3 text-center sm:w-auto sm:px-6">
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
    </section>
  );
}
