"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const THEME_KEY = "mos.audio.theme";
const CLICK_KEY = "mos.audio.click";

function readFlag(key: string, fallback: boolean) {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  if (raw === null) return fallback;
  return raw === "1";
}

function IconVolume({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M4 9v6h3.5L12 19V5L7.5 9H4Zm10.5 1.2a3.2 3.2 0 0 1 0 3.6l-1.3-1a1.6 1.6 0 0 0 0-1.6l1.3-1Zm2.3-2.4a6.4 6.4 0 0 1 0 8.4l-1.3-1a4.8 4.8 0 0 0 0-6.4l1.3-1Z" />
    </svg>
  );
}

function IconClick({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M11 2h2v4h-2V2Zm0 16h2v4h-2v-4ZM2 11h4v2H2v-2Zm16 0h4v2h-4v-2ZM7.1 5.7l1.4-1.4 2.8 2.8-1.4 1.4-2.8-2.8Zm5.6 9.8 2.8 2.8-1.4 1.4-2.8-2.8 1.4-1.4Zm0-8.4 1.4-1.4 2.8 2.8-1.4 1.4-2.8-2.8ZM7.1 18.3l2.8-2.8 1.4 1.4-2.8 2.8-1.4-1.4ZM10 10h4v4h-4v-4Z" />
    </svg>
  );
}

export default function MusicControl({ className }: { className?: string }) {
  const [themeOn, setThemeOn] = useState(true);
  const [clickOn, setClickOn] = useState(true);

  useEffect(() => {
    setThemeOn(readFlag(THEME_KEY, true));
    setClickOn(readFlag(CLICK_KEY, true));
  }, []);

  function toggleTheme() {
    setThemeOn((prev) => {
      const next = !prev;
      window.localStorage.setItem(THEME_KEY, next ? "1" : "0");
      return next;
    });
  }

  function toggleClick() {
    setClickOn((prev) => {
      const next = !prev;
      window.localStorage.setItem(CLICK_KEY, next ? "1" : "0");
      return next;
    });
  }

  return (
    <div className={cn("flex items-center gap-3 md:gap-4", className)}>
      <ControlButton active={themeOn} onClick={toggleTheme} label="Музыка">
        <IconVolume className="h-5 w-5 md:h-6 md:w-6" />
      </ControlButton>
      <ControlButton active={clickOn} onClick={toggleClick} label="Звуки кликов">
        <IconClick className="h-5 w-5 md:h-6 md:w-6" />
      </ControlButton>
    </div>
  );
}

function ControlButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "bg-blurBg inline-flex h-9 w-9 flex-col items-center justify-center rounded-lg p-2 text-mos-text transition-opacity md:h-12 md:w-12",
        !active && "opacity-50",
      )}
    >
      {children}
    </button>
  );
}
