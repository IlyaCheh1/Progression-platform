export const SWIPE_THRESHOLD_PX = 40;
export const SWIPE_AXIS_RATIO = 1.2;
export const SWIPE_AXIS_LOCK_PX = 8;

export function classifySwipeAxis(deltaX: number, deltaY: number): "horizontal" | "vertical" | null {
  if (Math.abs(deltaX) < SWIPE_AXIS_LOCK_PX && Math.abs(deltaY) < SWIPE_AXIS_LOCK_PX) return null;
  if (Math.abs(deltaX) > Math.abs(deltaY) * SWIPE_AXIS_RATIO) return "horizontal";
  if (Math.abs(deltaY) > Math.abs(deltaX) * SWIPE_AXIS_RATIO) return "vertical";
  return null;
}
