"use client";

import { useCallback, useEffect, useState } from "react";

import {
  AUDIENCE_CHANGED_EVENT,
  AUDIENCE_QUERY,
  resolveAudience,
  writeStoredAudience,
  type AudienceMode,
} from "@/lib/audience";

function currentAudience(): AudienceMode {
  if (typeof window === "undefined") return "adults";
  return resolveAudience(window.location.search);
}

function syncAudienceUrl(mode: AudienceMode) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (mode === "kids") url.searchParams.set(AUDIENCE_QUERY, "kids");
  else url.searchParams.delete(AUDIENCE_QUERY);
  const next = `${url.pathname}${url.search}${url.hash}`;
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (next !== current) {
    window.history.replaceState(window.history.state, "", next);
  }
}

export function useAudience() {
  const [mode, setModeState] = useState<AudienceMode>(currentAudience);

  useEffect(() => {
    const next = currentAudience();
    setModeState(next);
    writeStoredAudience(next);
    syncAudienceUrl(next);

    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<AudienceMode>).detail;
      if (detail === "kids" || detail === "adults") setModeState(detail);
    };
    window.addEventListener(AUDIENCE_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(AUDIENCE_CHANGED_EVENT, onChange);
  }, []);

  const setMode = useCallback((next: AudienceMode) => {
    writeStoredAudience(next);
    syncAudienceUrl(next);
    setModeState(next);
    window.dispatchEvent(new CustomEvent<AudienceMode>(AUDIENCE_CHANGED_EVENT, { detail: next }));
  }, []);

  return { mode, setMode, isKids: mode === "kids" };
}
