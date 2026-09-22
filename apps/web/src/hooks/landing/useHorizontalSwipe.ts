"use client";

import { useEffect, useRef } from "react";

import { classifySwipeAxis, SWIPE_AXIS_RATIO, SWIPE_THRESHOLD_PX } from "@/lib/landing/rooms-swipe";

const PHONE_QUERY = "(max-width: 767px)";

/**
 * Phone-only horizontal swipe. Vertical page scroll stays free.
 * A completed swipe swallows the click that would otherwise land on a child control.
 */
export function useHorizontalSwipe(onSwipe: (direction: -1 | 1) => void) {
  const ref = useRef<HTMLDivElement>(null);
  const onSwipeRef = useRef(onSwipe);
  onSwipeRef.current = onSwipe;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    let startX = 0;
    let startY = 0;
    let axis: "horizontal" | "vertical" | null = null;
    let swiped = false;

    const onStart = (event: TouchEvent) => {
      const touch = event.changedTouches[0];
      if (!touch) return;
      startX = touch.clientX;
      startY = touch.clientY;
      axis = null;
      swiped = false;
    };

    const onMove = (event: TouchEvent) => {
      if (!window.matchMedia(PHONE_QUERY).matches) return;
      const touch = event.touches[0];
      if (!touch) return;
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;
      if (!axis) {
        axis = classifySwipeAxis(deltaX, deltaY);
        if (!axis) return;
      }
      if (axis === "horizontal") event.preventDefault();
    };

    const onEnd = (event: TouchEvent) => {
      const touch = event.changedTouches[0];
      if (!touch) return;
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;
      const locked = axis;
      axis = null;
      if (!window.matchMedia(PHONE_QUERY).matches) return;
      if (locked === "vertical") return;
      if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;
      if (Math.abs(deltaX) < Math.abs(deltaY) * SWIPE_AXIS_RATIO) return;
      swiped = true;
      onSwipeRef.current(deltaX < 0 ? 1 : -1);
    };

    const onClick = (event: Event) => {
      if (!swiped) return;
      swiped = false;
      event.preventDefault();
      event.stopPropagation();
    };

    node.addEventListener("touchstart", onStart, { passive: true });
    node.addEventListener("touchmove", onMove, { passive: false });
    node.addEventListener("touchend", onEnd, { passive: true });
    node.addEventListener("touchcancel", onEnd, { passive: true });
    node.addEventListener("click", onClick, true);

    return () => {
      node.removeEventListener("touchstart", onStart);
      node.removeEventListener("touchmove", onMove);
      node.removeEventListener("touchend", onEnd);
      node.removeEventListener("touchcancel", onEnd);
      node.removeEventListener("click", onClick, true);
    };
  }, []);

  return ref;
}
