"use client";

import { useRef } from "react";
import Button from "@/components/ui/button";
import { useAudience } from "@/hooks/landing/useAudience";
import { useRevealFade } from "@/hooks/landing/useRevealFade";

export default function Join() {
  const sectionRef = useRef<HTMLElement>(null);
  const { isKids } = useAudience();
  useRevealFade(sectionRef, 0.15);

  return (
    <section id="join" ref={sectionRef} className="join-section relative z-10 overflow-hidden px-6">
      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="reveal-fade relative px-6 text-center md:px-12">
          <h2 className="mobile-fluid-join-title mx-auto mb-9 flex w-full flex-col gap-[1.875rem] font-unbounded font-medium leading-snug text-white md:gap-[2.625rem] md:text-5xl">
            <span className="block w-full">
              {isKids ? "Приведите ребёнка на ковёр." : "Хватит быть героем в цифровом мире."}
            </span>
            <span className="block w-full" style={{ color: "var(--color-controlsPrimaryActive)" }}>
              {isKids ? "Ушу «Клинки Востока» с 6 лет." : "Пора взять в руки меч."}
            </span>
          </h2>
          <div className="mt-10 flex justify-center md:mt-14">
            <Button
              href="/contact"
              variant="primary"
              size="lg"
              className="cta-pulse w-full max-w-[224px] px-8 uppercase sm:w-auto sm:min-w-[260px] sm:max-w-[280px]"
            >
              {isKids ? "Записать ребёнка" : "Оставить заявку"}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
