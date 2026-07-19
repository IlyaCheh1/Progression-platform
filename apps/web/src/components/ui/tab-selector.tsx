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

export default function TabSelector({
  items,
  activeId,
  onChange,
  className,
  isLoading,
}: TabSelectorProps) {
  return (
    <div
      className={cn(
        "flex w-fit min-h-10 items-center gap-2 rounded-[24px] bg-mos-bg/90 px-1 py-1 backdrop-blur-md md:min-h-[60px] md:gap-4 md:px-3 md:py-2",
        className,
      )}
      role="tablist"
    >
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
              "box-border flex h-8 items-center overflow-hidden rounded-2xl transition-all duration-300 md:h-11",
              active
                ? "bg-white/10 px-3 py-2 md:px-4 md:py-2.5"
                : "w-11 justify-center px-3 hover:bg-white/5 md:w-auto md:px-4",
              (item.disabled || isLoading) && "cursor-not-allowed opacity-60",
            )}
          >
            <span className="flex min-w-0 items-center gap-2 md:gap-3">
              {item.icon ? (
                <span
                  className={cn(
                    "shrink-0 text-sm transition-colors md:text-base",
                    active ? "text-mos-text" : "text-mos-muted",
                  )}
                >
                  {item.icon}
                </span>
              ) : null}
              <span
                className={cn(
                  "whitespace-nowrap font-medium text-mos-text transition-all duration-300",
                  "text-[10px] leading-[14px] md:text-sm md:leading-5",
                  active ? "max-w-[200px] opacity-100" : "max-w-0 overflow-hidden opacity-0 md:max-w-[200px] md:opacity-100",
                )}
              >
                {item.label}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
