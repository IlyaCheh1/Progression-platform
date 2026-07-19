"use client";

import { useEffect, type RefObject } from "react";

/** OG-landing IntersectionObserver → `.reveal-fade.visible` */
export function useRevealFade(
  sectionRef: RefObject<HTMLElement | null>,
  threshold = 0.12,
  refreshKey?: unknown,
) {
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      },
      { threshold },
    );

    section.querySelectorAll(".reveal-fade:not(.visible)").forEach((el) => {
      observer.observe(el);

      const rect = el.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (inView) el.classList.add("visible");
    });

    return () => observer.disconnect();
  }, [sectionRef, threshold, refreshKey]);
}
