"use client";

import { useLandscapeLock } from "@/hooks/use-landscape-lock";

/** Locks / force-rotates mobile viewport to landscape while mounted. */
export default function LandscapeLock() {
  useLandscapeLock(true);
  return null;
}
