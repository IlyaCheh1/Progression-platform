export const SWIPE_THRESHOLD_PX = 40;
export const SWIPE_AXIS_RATIO = 1.2;
export const SWIPE_AXIS_LOCK_PX = 8;
export const WHEEL_GESTURE_IDLE_MS = 160;
export const LAPTOP_GESTURE_PHONE_QUERY = "(max-width: 767px)";

export type SwipeAxis = "horizontal" | "vertical";
export type SwipeSource = "touch" | "wheel";

export function classifySwipeAxis(deltaX: number, deltaY: number): SwipeAxis | null {
  if (Math.abs(deltaX) < SWIPE_AXIS_LOCK_PX && Math.abs(deltaY) < SWIPE_AXIS_LOCK_PX) return null;
  if (Math.abs(deltaX) > Math.abs(deltaY) * SWIPE_AXIS_RATIO) return "horizontal";
  if (Math.abs(deltaY) > Math.abs(deltaX) * SWIPE_AXIS_RATIO) return "vertical";
  return null;
}

/** 1 moves to the next slide, -1 to the previous. Wheel sign is opposite of a finger drag. */
export function horizontalSlideStep(deltaX: number, deltaY: number, source: SwipeSource): -1 | 0 | 1 {
  if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return 0;
  if (Math.abs(deltaX) < Math.abs(deltaY) * SWIPE_AXIS_RATIO) return 0;
  const towardNext = source === "wheel" ? deltaX > 0 : deltaX < 0;
  return towardNext ? 1 : -1;
}

export type WheelGesture = {
  x: number;
  y: number;
  axis: SwipeAxis | null;
  consumed: boolean;
};

export function createWheelGesture(): WheelGesture {
  return { x: 0, y: 0, axis: null, consumed: false };
}

export type WheelDecision = {
  gesture: WheelGesture;
  preventDefault: boolean;
  step: -1 | 0 | 1;
};

/**
 * Trackpad wheel. Vertical gestures never call preventDefault, so the page can scroll.
 * A horizontal burst advances one slide, then ignores the rest until the gesture resets.
 */
export function applyWheelDelta(gesture: WheelGesture, deltaX: number, deltaY: number): WheelDecision {
  const next: WheelGesture = {
    x: gesture.x + deltaX,
    y: gesture.y + deltaY,
    axis: gesture.axis,
    consumed: gesture.consumed,
  };
  if (!next.axis) next.axis = classifySwipeAxis(next.x, next.y);
  if (next.axis !== "horizontal") {
    return { gesture: next, preventDefault: false, step: 0 };
  }
  if (next.consumed) {
    return { gesture: next, preventDefault: true, step: 0 };
  }
  const step = horizontalSlideStep(next.x, next.y, "wheel");
  if (step !== 0) next.consumed = true;
  return { gesture: next, preventDefault: true, step };
}

/** Mouse or pen drag uses the same sign as a touch swipe. Touch pointers stay on the touch path. */
export function pointerSlideStep(deltaX: number, deltaY: number, pointerType: string): -1 | 0 | 1 {
  if (pointerType === "touch") return 0;
  return horizontalSlideStep(deltaX, deltaY, "touch");
}
