"use client";

import { useEffect, useRef, useState } from "react";

export type ScrollDirection = "up" | "down";

export function useScrollDirection(enabled = true): ScrollDirection {
  const [direction, setDirection] = useState<ScrollDirection>("down");
  const lastScrollY = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    lastScrollY.current = window.scrollY;

    const onScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY.current;
      if (Math.abs(delta) < 4) return;

      setDirection(delta > 0 ? "down" : "up");
      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.visualViewport?.addEventListener("scroll", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.visualViewport?.removeEventListener("scroll", onScroll);
    };
  }, [enabled]);

  return direction;
}
