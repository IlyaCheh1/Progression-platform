"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { audienceFromPathname, homeForAudience, type AudienceMode } from "@/lib/audience";

function useAudienceState(initialMode: AudienceMode) {
  const pathname = usePathname();
  const router = useRouter();
  const mode = pathname ? audienceFromPathname(pathname) : initialMode;

  const setMode = useCallback(
    (next: AudienceMode) => {
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      router.push(`${homeForAudience(next)}${hash}`);
    },
    [router],
  );

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
