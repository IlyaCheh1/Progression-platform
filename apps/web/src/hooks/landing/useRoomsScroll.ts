"use client";

import { RefObject, useCallback, useEffect, useRef, useState } from "react";

import {
  applyWheelDelta,
  classifySwipeAxis,
  createWheelGesture,
  LAPTOP_GESTURE_PHONE_QUERY,
  pointerSlideStep,
  SWIPE_AXIS_RATIO,
  SWIPE_THRESHOLD_PX,
  WHEEL_GESTURE_IDLE_MS,
} from "@/lib/landing/rooms-swipe";

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
 * Horizontal direction slides. Vertical page scroll is never captured.
 * Slides change via goToRoom, a phone touch swipe, or a laptop trackpad
 * (horizontal wheel deltaX / mouse or pen drag).
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

  useEffect(() => {
    const sticky = trackRef.current?.parentElement;
    if (!sticky) return;

    const phoneGesture = () => window.matchMedia(LAPTOP_GESTURE_PHONE_QUERY).matches;
    let gesture = createWheelGesture();
    let idleTimer = 0;
    let drag: { id: number; x: number; y: number; axis: "horizontal" | "vertical" | null; stepped: boolean } | null = null;
    let swallowClick = false;

    const handleWheel = (event: WheelEvent) => {
      if (phoneGesture()) return;
      const decision = applyWheelDelta(gesture, event.deltaX, event.deltaY);
      gesture = decision.gesture;
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        gesture = createWheelGesture();
      }, WHEEL_GESTURE_IDLE_MS);
      if (decision.preventDefault) event.preventDefault();
      if (decision.step !== 0) goToRoom(snappedRoomRef.current + decision.step);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!drag || event.pointerId !== drag.id || drag.stepped) return;
      const deltaX = event.clientX - drag.x;
      const deltaY = event.clientY - drag.y;
      if (!drag.axis) drag.axis = classifySwipeAxis(deltaX, deltaY);
      if (drag.axis !== "horizontal") return;
      const step = pointerSlideStep(deltaX, deltaY, event.pointerType);
      if (step === 0) return;
      event.preventDefault();
      drag.stepped = true;
      swallowClick = true;
      goToRoom(snappedRoomRef.current + step);
    };

    const endDragListeners = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!drag || event.pointerId !== drag.id) return;
      const deltaX = event.clientX - drag.x;
      const deltaY = event.clientY - drag.y;
      const stepped = drag.stepped;
      drag = null;
      endDragListeners();
      if (stepped) return;
      const step = pointerSlideStep(deltaX, deltaY, event.pointerType);
      if (step === 0) return;
      swallowClick = true;
      goToRoom(snappedRoomRef.current + step);
    };

    const onPointerCancel = (event: PointerEvent) => {
      if (!drag || event.pointerId !== drag.id) return;
      drag = null;
      endDragListeners();
    };

    const onPointerDown = (event: PointerEvent) => {
      if (phoneGesture()) return;
      if (event.pointerType === "touch") return;
      if (event.button !== 0) return;
      const target = event.target;
      if (target instanceof Element && target.closest("img, video")) event.preventDefault();
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, axis: null, stepped: false };
      window.addEventListener("pointermove", onPointerMove, { passive: false });
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerCancel);
    };

    const onClick = (event: MouseEvent) => {
      if (!swallowClick) return;
      swallowClick = false;
      event.preventDefault();
      event.stopPropagation();
    };

    sticky.addEventListener("wheel", handleWheel, { passive: false });
    sticky.addEventListener("pointerdown", onPointerDown);
    sticky.addEventListener("click", onClick, true);

    return () => {
      window.clearTimeout(idleTimer);
      endDragListeners();
      sticky.removeEventListener("wheel", handleWheel);
      sticky.removeEventListener("pointerdown", onPointerDown);
      sticky.removeEventListener("click", onClick, true);
    };
  }, [trackRef, goToRoom]);

  return { activeRoom, goToRoom };
}
