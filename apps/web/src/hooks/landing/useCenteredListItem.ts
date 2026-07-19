"use client";

import { RefObject, useEffect, useState } from "react";
import type { ScrollDirection } from "@/hooks/landing/useScrollDirection";

export type CenteredListOptions = {
  measureSelector?: string;
  scrollDirection?: ScrollDirection;
};

export function useCenteredListItem(
  containerRef: RefObject<HTMLElement | null>,
  itemSelector: string,
  enabled = true,
  revalidateKey?: unknown,
  options?: CenteredListOptions,
) {
  const [centeredIndex, setCenteredIndex] = useState<number | null>(null);
  const measureSelector = options?.measureSelector;
  const scrollDirection = options?.scrollDirection ?? "down";

  useEffect(() => {
    if (!enabled) {
      setCenteredIndex(null);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    let rafId = 0;

    const update = () => {
      const items = container.querySelectorAll<HTMLElement>(itemSelector);
      if (!items.length) {
        setCenteredIndex(null);
        return;
      }

      const viewportAnchor = window.innerHeight * 0.5;
      let closestIndex = 0;
      let closestDistance = Infinity;

      items.forEach((item, index) => {
        const measureTarget = measureSelector
          ? (item.querySelector<HTMLElement>(measureSelector) ?? item)
          : item;
        const rect = measureTarget.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;

        const itemCenter = rect.top + rect.height / 2;
        const distance = Math.abs(itemCenter - viewportAnchor);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      setCenteredIndex(closestDistance === Infinity ? null : closestIndex);
    };

    const scheduleUpdate = () => {
      window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    window.visualViewport?.addEventListener("scroll", scheduleUpdate);
    window.visualViewport?.addEventListener("resize", scheduleUpdate);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      window.visualViewport?.removeEventListener("scroll", scheduleUpdate);
      window.visualViewport?.removeEventListener("resize", scheduleUpdate);
    };
  }, [containerRef, itemSelector, enabled, revalidateKey, measureSelector, scrollDirection]);

  return centeredIndex;
}
