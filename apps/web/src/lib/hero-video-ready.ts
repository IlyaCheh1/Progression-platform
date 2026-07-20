/** HTMLMediaElement.HAVE_FUTURE_DATA — same threshold as the `canplay` event. */
export const HERO_VIDEO_MIN_READY_STATE = 3;

export function isHeroVideoReady(readyState: number): boolean {
  return readyState >= HERO_VIDEO_MIN_READY_STATE;
}
