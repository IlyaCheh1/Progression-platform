"use client";

import { cn } from "@/lib/utils";

export type SelectorOption = {
  id: string;
  label: string;
};

type SelectorProps = {
  options: SelectorOption[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
};

/** Sliding dual-mode selector — anatomy OnlyGames Selector (secondary). */
export default function Selector({ options, activeId, onChange, className }: SelectorProps) {
  const activeIndex = Math.max(
    0,
    options.findIndex((o) => o.id === activeId),
  );

  return (
    <div
      className={cn(
        "relative flex w-fit items-center rounded-2xl bg-mos-stone/80 p-1 backdrop-blur-md",
        className,
      )}
      role="tablist"
    >
      <span
        aria-hidden
        className="absolute top-1 bottom-1 rounded-xl bg-white/10 transition-transform duration-300 ease-out"
        style={{
          width: `calc((100% - 8px) / ${options.length})`,
          transform: `translateX(calc(${activeIndex} * 100%))`,
          left: 4,
        }}
      />
      {options.map((option) => {
        const active = option.id === activeId;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.id)}
            className={cn(
              "relative z-10 min-w-[110px] px-4 py-2 text-center text-xs font-medium uppercase tracking-[0.12em] transition-colors md:min-w-[144px] md:text-sm",
              active ? "text-mos-amber" : "text-mos-muted hover:text-mos-text",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
