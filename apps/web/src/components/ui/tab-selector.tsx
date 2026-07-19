"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type TabSelectorItem = {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
};

type TabSelectorProps = {
  items: TabSelectorItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
  isLoading?: boolean;
};

/** Icon tab row — OG secondary selector anatomy (matches Selector surfaces). */
export default function TabSelector({
  items,
  activeId,
  onChange,
  className,
  isLoading,
}: TabSelectorProps) {
  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.id === activeId),
  );

  return (
    <div
      className={cn(
        "relative flex w-fit min-h-10 items-center gap-1 rounded-2xl bg-secondaryBg p-1 backdrop-blur-[25px] md:min-h-[60px] md:gap-2 md:rounded-3xl md:p-1.5",
        className,
      )}
      role="tablist"
    >
      <span
        aria-hidden
        className="absolute top-1 bottom-1 rounded-xl bg-white/10 transition-transform duration-300 ease-out md:rounded-2xl"
        style={{
          width: `calc((100% - ${items.length > 1 ? 8 : 4}px) / ${items.length})`,
          transform: `translateX(calc(${activeIndex} * 100%))`,
          left: 4,
        }}
      />
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={item.disabled || isLoading}
            onClick={() => onChange(item.id)}
            className={cn(
              "relative z-10 box-border flex h-8 min-w-[88px] items-center justify-center gap-2 overflow-hidden rounded-xl px-3 transition-colors md:h-11 md:min-w-[120px] md:rounded-2xl md:px-4",
              active ? "text-mos-amber" : "text-mos-muted hover:text-mos-text",
              (item.disabled || isLoading) && "cursor-not-allowed opacity-60",
            )}
          >
            {item.icon ? <span className="shrink-0 text-sm md:text-base">{item.icon}</span> : null}
            <span className="whitespace-nowrap text-[10px] font-medium leading-[14px] md:text-sm md:leading-5">
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
