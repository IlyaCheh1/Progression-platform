"use client";

import { useEffect } from "react";

const FORCE_CLASS = "mos-force-landscape";
const MOBILE_QUERY = "(max-width: 1023px)";

function isMobileViewport(): boolean {
  return window.matchMedia(MOBILE_QUERY).matches;
}

async function lockLandscape(): Promise<void> {
  const orientation = window.screen?.orientation;
  if (!orientation || typeof orientation.lock !== "function") return;
  try {
    await orientation.lock("landscape");
  } catch {
    // iOS Safari and most browsers reject lock outside fullscreen / PWA.
  }
}

function unlockOrientation(): void {
  try {
    window.screen?.orientation?.unlock?.();
  } catch {
    // ignore
  }
}

/**
 * On mobile, prefers landscape for stage screens (onboarding / profile):
 * tries Screen Orientation API, falls back to CSS body rotate via `mos-force-landscape`.
 */
export function useLandscapeLock(enabled = true) {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const root = document.documentElement;
    let active = false;

    const apply = () => {
      if (!isMobileViewport()) {
        if (active) {
          root.classList.remove(FORCE_CLASS);
          unlockOrientation();
          active = false;
        }
        return;
      }
      if (!active) {
        root.classList.add(FORCE_CLASS);
        void lockLandscape();
        active = true;
      }
    };

    apply();
    const media = window.matchMedia(MOBILE_QUERY);
    media.addEventListener("change", apply);

    return () => {
      media.removeEventListener("change", apply);
      root.classList.remove(FORCE_CLASS);
      unlockOrientation();
    };
  }, [enabled]);
}
