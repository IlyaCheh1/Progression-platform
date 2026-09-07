"use client";

import { RefObject, useCallback, useEffect, useRef, useState } from "react";

import { classifySwipeAxis, SWIPE_AXIS_RATIO, SWIPE_THRESHOLD_PX } from "@/lib/landing/rooms-swipe";

interface UseRoomsScrollResult {
  activeRoom: number;
  goToRoom: (index: number) => void;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function progressForRoom(index: number, roomsCount: number) {
  if (roomsCount <= 1) return 0;
  return index / (roomsCount - 1);
}

/**
 * Horizontal direction slides. Vertical page scroll is never captured:
 * slides change only via goToRoom (arrows, dots) or a clear horizontal swipe.
 */
export function useRoomsScroll(
  containerRef: RefObject<HTMLElement | null>,
  trackRef: RefObject<HTMLElement | null>,
  roomsCount: number,
  progressBarRef?: RefObject<HTMLDivElement | null>,
  _isMobile = false,
): UseRoomsScrollResult {
  const [activeRoom, setActiveRoom] = useState(0);
  const snappedRoomRef = useRef(0);

  const applyTrack = useCallback(
    (roomIndex: number, animate: boolean) => {
      const container = containerRef.current;
      const track = trackRef.current;
      if (!container || !track) return;

      const viewportWidth = window.innerWidth;
      container.style.setProperty("--room-slide-width", `${viewportWidth}px`);
      track.style.transition = animate
        ? "transform 0.35s cubic-bezier(0.25, 0.1, 0.25, 1)"
        : "none";

      const maxTranslate = Math.max(0, (roomsCount - 1) * viewportWidth);
      const progress = progressForRoom(roomIndex, roomsCount);
      progressBarRef?.current?.style.setProperty("width", `${progress * 100}%`);
      track.style.transform = `translate3d(-${progress * maxTranslate}px, 0, 0)`;
    },
    [containerRef, trackRef, roomsCount, progressBarRef],
  );

  const goToRoom = useCallback(
    (index: number) => {
      if (roomsCount <= 0) return;
      const clamped = clamp(index, 0, roomsCount - 1);
      snappedRoomRef.current = clamped;
      setActiveRoom(clamped);
      applyTrack(clamped, true);
    },
    [roomsCount, applyTrack],
  );

  useEffect(() => {
    applyTrack(snappedRoomRef.current, false);
    const handleResize = () => applyTrack(snappedRoomRef.current, false);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [applyTrack, roomsCount]);

  useEffect(() => {
    const sticky = trackRef.current?.parentElement;
    if (!sticky) return;

    let touchStartX = 0;
    let touchStartY = 0;
    let touchAxis: "horizontal" | "vertical" | null = null;

    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.changedTouches[0];
      if (!touch) return;
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchAxis = null;
    };

    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;

      if (!touchAxis) {
        touchAxis = classifySwipeAxis(deltaX, deltaY);
        if (!touchAxis) return;
      }

      // Only lock the horizontal gesture. Vertical page scroll stays free.
      if (touchAxis === "horizontal") event.preventDefault();
    };

    const handleTouchEnd = (event: TouchEvent) => {
      const touch = event.changedTouches[0];
      if (!touch) return;
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      const axis = touchAxis;
      touchAxis = null;

      if (axis === "vertical") return;
      if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;
      if (Math.abs(deltaX) < Math.abs(deltaY) * SWIPE_AXIS_RATIO) return;

      if (deltaX < 0) goToRoom(snappedRoomRef.current + 1);
      else goToRoom(snappedRoomRef.current - 1);
    };

    sticky.addEventListener("touchstart", handleTouchStart, { passive: true });
    sticky.addEventListener("touchmove", handleTouchMove, { passive: false });
    sticky.addEventListener("touchend", handleTouchEnd, { passive: true });
    sticky.addEventListener("touchcancel", handleTouchEnd, { passive: true });

    return () => {
      sticky.removeEventListener("touchstart", handleTouchStart);
      sticky.removeEventListener("touchmove", handleTouchMove);
      sticky.removeEventListener("touchend", handleTouchEnd);
      sticky.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [trackRef, goToRoom, roomsCount]);

  return { activeRoom, goToRoom };
}
