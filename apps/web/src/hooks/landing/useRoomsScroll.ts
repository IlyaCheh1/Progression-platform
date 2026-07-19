"use client";

import { RefObject, useCallback, useEffect, useRef, useState } from "react";

const SWIPE_THRESHOLD_PX = 40;
const SWIPE_AXIS_RATIO = 1.2;
const SWIPE_AXIS_LOCK_PX = 8;
const IOS_BACK_EDGE_PX = 36;
const WHEEL_DELTA_THRESHOLD = 48;
const WHEEL_STEP_COOLDOWN_MS = 550;
const SECTION_ENTRY_SETTLE_MS = 400;
const WHEEL_GESTURE_IDLE_MS = 160;
const WHEEL_ACCEL_FACTOR = 1.2;
const WHEEL_HISTORY_SIZE = 8;
const SECTION_PIN_TOLERANCE_PX = 8;

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

type SectionCaptureState = "above" | "pinned" | "below";

function getSectionMetrics(container: HTMLElement) {
  const offsetTop = container.offsetTop;
  const scrollRange = Math.max(0, container.offsetHeight - window.innerHeight);
  const scrollY = window.scrollY;
  const rect = container.getBoundingClientRect();
  return { offsetTop, scrollRange, scrollY, rect };
}

function isWithinSection(offsetTop: number, scrollRange: number, scrollY: number) {
  return scrollY >= offsetTop - 2 && scrollY <= offsetTop + scrollRange + 2;
}

function getSectionCaptureState(container: HTMLElement): SectionCaptureState {
  const { offsetTop, scrollRange, scrollY } = getSectionMetrics(container);
  if (scrollY < offsetTop - 2) return "above";
  if (scrollY > offsetTop + scrollRange + 2) return "below";
  return "pinned";
}

function pinSectionScroll(offsetTop: number) {
  if (Math.abs(window.scrollY - offsetTop) <= SECTION_PIN_TOLERANCE_PX) return;
  window.scrollTo({ top: offsetTop, behavior: "auto" });
}

export function useRoomsScroll(
  containerRef: RefObject<HTMLElement | null>,
  trackRef: RefObject<HTMLElement | null>,
  roomsCount: number,
  progressBarRef?: RefObject<HTMLDivElement | null>,
  isMobile = false,
): UseRoomsScrollResult {
  const [activeRoom, setActiveRoom] = useState(0);
  const lastActiveRoomRef = useRef(0);
  const snappedRoomRef = useRef(0);
  const wheelAccumRef = useRef(0);
  const wheelLockedRef = useRef(false);
  const wheelUnlockTimerRef = useRef(0);
  const wheelGestureIdleTimerRef = useRef(0);
  const sectionArmedAtRef = useRef(0);
  const wheelHistoryRef = useRef<number[]>([]);
  const lastWheelEventAtRef = useRef(0);

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
    (index: number, behavior: ScrollBehavior = "smooth") => {
      if (roomsCount <= 0) return;
      const clamped = clamp(index, 0, roomsCount - 1);
      snappedRoomRef.current = clamped;
      lastActiveRoomRef.current = clamped;
      setActiveRoom(clamped);
      applyTrack(clamped, behavior === "smooth");
    },
    [roomsCount, applyTrack],
  );

  useEffect(() => {
    if (!isMobile) return;
    const sticky = trackRef.current?.parentElement;
    if (!sticky) return;

    applyTrack(snappedRoomRef.current, false);

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

      if (touchStartX <= IOS_BACK_EDGE_PX && Math.abs(deltaX) > 2 && Math.abs(deltaX) >= Math.abs(deltaY)) {
        touchAxis = "horizontal";
        event.preventDefault();
        return;
      }

      if (!touchAxis) {
        if (Math.abs(deltaX) < SWIPE_AXIS_LOCK_PX && Math.abs(deltaY) < SWIPE_AXIS_LOCK_PX) return;
        if (Math.abs(deltaX) > Math.abs(deltaY) * SWIPE_AXIS_RATIO) touchAxis = "horizontal";
        else if (Math.abs(deltaY) > Math.abs(deltaX) * SWIPE_AXIS_RATIO) touchAxis = "vertical";
      }

      if (touchAxis === "horizontal") event.preventDefault();
    };

    const handleTouchEnd = (event: TouchEvent) => {
      const touch = event.changedTouches[0];
      if (!touch) return;

      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      touchAxis = null;

      if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;
      if (Math.abs(deltaX) < Math.abs(deltaY) * SWIPE_AXIS_RATIO) return;

      if (deltaX < 0) goToRoom(snappedRoomRef.current + 1);
      else goToRoom(snappedRoomRef.current - 1);
    };

    const handleResize = () => applyTrack(snappedRoomRef.current, false);

    sticky.addEventListener("touchstart", handleTouchStart, { passive: true });
    sticky.addEventListener("touchmove", handleTouchMove, { passive: false });
    sticky.addEventListener("touchend", handleTouchEnd, { passive: true });
    sticky.addEventListener("touchcancel", handleTouchEnd, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      sticky.removeEventListener("touchstart", handleTouchStart);
      sticky.removeEventListener("touchmove", handleTouchMove);
      sticky.removeEventListener("touchend", handleTouchEnd);
      sticky.removeEventListener("touchcancel", handleTouchEnd);
      window.removeEventListener("resize", handleResize);
    };
  }, [isMobile, trackRef, applyTrack, goToRoom]);

  useEffect(() => {
    if (!isMobile) return;
    const container = containerRef.current;
    if (!container) return;

    const historyState = { mosDirectionsGuard: true };
    let guardPushed = false;
    let sectionInView = false;

    const pushGuard = () => {
      if (guardPushed) return;
      window.history.pushState(historyState, "");
      guardPushed = true;
    };

    const handlePopState = () => {
      if (!sectionInView || !guardPushed) return;
      const currentRoom = snappedRoomRef.current;
      if (currentRoom > 0) {
        window.history.pushState(historyState, "");
        goToRoom(currentRoom - 1, "smooth");
        return;
      }
      guardPushed = false;
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        sectionInView = entry.isIntersecting && entry.intersectionRatio >= 0.55;
        if (sectionInView) pushGuard();
      },
      { threshold: [0, 0.55] },
    );

    observer.observe(container);
    window.addEventListener("popstate", handlePopState);

    return () => {
      observer.disconnect();
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isMobile, containerRef, goToRoom]);

  useEffect(() => {
    if (isMobile) return;
    const container = containerRef.current;
    if (!container) return;

    applyTrack(snappedRoomRef.current, false);

    let wasInCarouselZone = false;
    let pinRafId = 0;

    const resetWheelGesture = () => {
      wheelAccumRef.current = 0;
    };

    const scheduleWheelGestureReset = () => {
      window.clearTimeout(wheelGestureIdleTimerRef.current);
      wheelGestureIdleTimerRef.current = window.setTimeout(resetWheelGesture, WHEEL_GESTURE_IDLE_MS);
    };

    const armSectionEntry = () => {
      sectionArmedAtRef.current = Date.now() + SECTION_ENTRY_SETTLE_MS;
      resetWheelGesture();
    };

    const isSectionArmed = () => Date.now() >= sectionArmedAtRef.current;

    const stepSlide = (direction: 1 | -1) => {
      const current = snappedRoomRef.current;
      const next = clamp(current + direction, 0, roomsCount - 1);
      if (next === current) return false;

      wheelLockedRef.current = true;
      wheelAccumRef.current = 0;
      goToRoom(next, "smooth");

      if (next === roomsCount - 1) {
        const { offsetTop, scrollRange } = getSectionMetrics(container);
        window.scrollTo({ top: offsetTop + scrollRange, behavior: "auto" });
      }

      window.clearTimeout(wheelUnlockTimerRef.current);
      wheelUnlockTimerRef.current = window.setTimeout(() => {
        wheelLockedRef.current = false;
      }, WHEEL_STEP_COOLDOWN_MS);

      return true;
    };

    const shouldReleaseScroll = (dominantDelta: number, current: number, offsetTop: number, scrollY: number) => {
      if (dominantDelta > 0 && current >= roomsCount - 1) return true;
      if (dominantDelta < 0 && current <= 0 && scrollY <= offsetTop + SECTION_PIN_TOLERANCE_PX) return true;
      return false;
    };

    const teleportToSectionEnd = (offsetTop: number, scrollRange: number) => {
      if (window.scrollY < offsetTop + scrollRange) {
        window.scrollTo({ top: offsetTop + scrollRange, behavior: "auto" });
      }
    };

    const handleWheel = (event: WheelEvent) => {
      const { offsetTop, scrollRange, scrollY, rect } = getSectionMetrics(container);
      const captureState = getSectionCaptureState(container);
      const viewportHeight = window.innerHeight;
      const current = snappedRoomRef.current;

      const dominantDelta =
        Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      if (Math.abs(dominantDelta) < 1) return;

      const magnitude = Math.abs(dominantDelta);
      const now = Date.now();
      const isFreshGesture = now - lastWheelEventAtRef.current >= WHEEL_GESTURE_IDLE_MS;
      lastWheelEventAtRef.current = now;

      if (isFreshGesture) wheelHistoryRef.current = [];
      const history = wheelHistoryRef.current;
      const avgMagnitude = history.length
        ? history.reduce((sum, value) => sum + value, 0) / history.length
        : 0;
      const isIntentional = isFreshGesture || magnitude > avgMagnitude * WHEEL_ACCEL_FACTOR;
      history.push(magnitude);
      if (history.length > WHEEL_HISTORY_SIZE) history.shift();

      const approachingFromAbove =
        scrollY < offsetTop &&
        rect.top < viewportHeight * 0.9 &&
        rect.bottom > viewportHeight * 0.15 &&
        dominantDelta > 0;

      const inCarouselZone =
        captureState === "pinned" || approachingFromAbove || isWithinSection(offsetTop, scrollRange, scrollY);

      if (!inCarouselZone) {
        if (wasInCarouselZone) resetWheelGesture();
        wasInCarouselZone = false;
        return;
      }

      if (!wasInCarouselZone) {
        armSectionEntry();
        if (
          dominantDelta < 0 &&
          current === roomsCount - 1 &&
          scrollY > offsetTop + SECTION_PIN_TOLERANCE_PX
        ) {
          window.scrollTo({ top: offsetTop, behavior: "auto" });
        }
      }
      wasInCarouselZone = true;

      if (wheelLockedRef.current) {
        event.preventDefault();
        if (current < roomsCount - 1) pinSectionScroll(offsetTop);
        scheduleWheelGestureReset();
        return;
      }

      if (shouldReleaseScroll(dominantDelta, current, offsetTop, scrollY)) {
        resetWheelGesture();
        if (dominantDelta > 0) teleportToSectionEnd(offsetTop, scrollRange);
        return;
      }

      event.preventDefault();
      pinSectionScroll(offsetTop);

      if (!isSectionArmed() || !isIntentional) {
        scheduleWheelGestureReset();
        return;
      }

      wheelAccumRef.current += dominantDelta;
      scheduleWheelGestureReset();

      if (Math.abs(wheelAccumRef.current) < WHEEL_DELTA_THRESHOLD) return;

      const direction: 1 | -1 = wheelAccumRef.current > 0 ? 1 : -1;
      if (!stepSlide(direction)) resetWheelGesture();
    };

    const handleScroll = () => {
      const current = snappedRoomRef.current;
      if (current >= roomsCount - 1) return;
      const { offsetTop, scrollRange, scrollY } = getSectionMetrics(container);
      if (!isWithinSection(offsetTop, scrollRange, scrollY)) return;
      if (scrollY <= offsetTop + SECTION_PIN_TOLERANCE_PX) return;

      window.cancelAnimationFrame(pinRafId);
      pinRafId = window.requestAnimationFrame(() => pinSectionScroll(offsetTop));
    };

    const handleResize = () => applyTrack(snappedRoomRef.current, false);

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      window.cancelAnimationFrame(pinRafId);
      window.clearTimeout(wheelUnlockTimerRef.current);
      window.clearTimeout(wheelGestureIdleTimerRef.current);
    };
  }, [isMobile, containerRef, applyTrack, goToRoom, roomsCount]);

  const prevIsMobileRef = useRef(isMobile);
  useEffect(() => {
    if (prevIsMobileRef.current !== isMobile) applyTrack(snappedRoomRef.current, false);
    prevIsMobileRef.current = isMobile;
  }, [isMobile, applyTrack]);

  return { activeRoom, goToRoom };
}
