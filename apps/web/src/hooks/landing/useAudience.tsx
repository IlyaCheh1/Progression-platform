"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

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

function useAudienceState(initialMode: AudienceMode) {
  const [mode, setModeState] = useState<AudienceMode>(initialMode);

  useEffect(() => {
    const next = currentAudience();
    setModeState(next);
    writeStoredAudience(next);
    syncAudienceUrl(next);

    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<AudienceMode>).detail;
      if (detail === "kids" || detail === "adults") setModeState(detail);
    };
    const onPopState = () => setModeState(currentAudience());
    window.addEventListener(AUDIENCE_CHANGED_EVENT, onChange);
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener(AUDIENCE_CHANGED_EVENT, onChange);
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  const setMode = useCallback((next: AudienceMode) => {
    writeStoredAudience(next);
    syncAudienceUrl(next);
    setModeState(next);
    window.dispatchEvent(new CustomEvent<AudienceMode>(AUDIENCE_CHANGED_EVENT, { detail: next }));
  }, []);

  return useMemo(() => ({ mode, setMode, isKids: mode === "kids" }), [mode, setMode]);
}

const AudienceContext = createContext<ReturnType<typeof useAudienceState> | null>(null);

export function AudienceProvider({
  initialMode = "adults",
  children,
}: {
  initialMode?: AudienceMode;
  children: ReactNode;
}) {
  const value = useAudienceState(initialMode);
  return <AudienceContext.Provider value={value}>{children}</AudienceContext.Provider>;
}

export function useAudience() {
  const ctx = useContext(AudienceContext);
  if (!ctx) {
    throw new Error("useAudience must be used inside AudienceProvider");
  }
  return ctx;
}
