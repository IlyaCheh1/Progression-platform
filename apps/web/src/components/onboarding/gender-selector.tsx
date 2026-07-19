"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { GenderId } from "@/lib/avatars";

const OPTIONS: Array<{ value: GenderId; label: string }> = [
  { value: "MALE", label: "мужской" },
  { value: "FEMALE", label: "женский" },
];

type GenderSelectorProps = {
  value: GenderId;
  onChange: (value: GenderId) => void;
  className?: string;
};

export default function GenderSelector({ value, onChange, className }: GenderSelectorProps) {
  const [desktop, setDesktop] = useState(false);
  const activeIndex = OPTIONS.findIndex((option) => option.value === value);
  const optionWidth = desktop ? 144 : 110;
  const gap = 8;

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1280px)");
    const sync = () => setDesktop(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return (
    <div
      className={cn(
        "relative mx-auto inline-flex h-8 w-fit items-center justify-start overflow-hidden rounded-3xl bg-mos-bg/60 p-1 backdrop-blur-[6px] xl:h-[60px] xl:p-2",
        className,
      )}
      role="radiogroup"
      aria-label="Пол персонажа"
      tabIndex={0}
      onKeyDown={(event) => {
        const current = OPTIONS.findIndex((option) => option.value === value);
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          event.preventDefault();
          onChange(OPTIONS[(current + 1) % OPTIONS.length]!.value);
        }
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          event.preventDefault();
          onChange(OPTIONS[(current - 1 + OPTIONS.length) % OPTIONS.length]!.value);
        }
      }}
    >
      {activeIndex >= 0 && (
        <div
          className="absolute top-1 z-0 h-6 rounded-2xl bg-gradient-controls-primary-active transition-transform duration-300 ease-out xl:top-2 xl:h-11"
          style={{
            width: optionWidth,
            transform: `translateX(${activeIndex * (optionWidth + gap)}px)`,
          }}
        />
      )}

      {OPTIONS.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            className={cn(
              "relative z-10 flex h-6 items-center justify-center rounded-2xl px-2.5 font-unbounded text-xs uppercase tracking-wide text-mos-text transition-colors duration-200",
              "xl:h-11",
              !active && "hover:bg-white/10",
            )}
            style={{ width: optionWidth, minWidth: optionWidth, maxWidth: optionWidth }}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
