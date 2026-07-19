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

/** OG inventory TabSelector — inactive tabs show icon only, active expands with label. */
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
        "box-border flex min-h-10 w-fit items-center gap-2 rounded-[24px] bg-[#141416] p-1 backdrop-blur-[25px] md:min-h-[60px] md:gap-4 md:px-3 md:py-2",
        className,
      )}
      role="tablist"
    >
      {items.map((item) => {
        const active = item.id === activeId;
        const disabled = item.disabled || isLoading;

        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={disabled}
            onClick={() => {
              if (disabled || active) return;
              onChange(item.id);
            }}
            className={cn(
              "box-border flex select-none flex-col overflow-hidden rounded-2xl transition-all duration-300 ease-in-out",
              active
                ? "w-auto items-start justify-start bg-[var(--color-controlsBlur)] px-3 py-2 md:px-4 md:py-2.5"
                : "w-11 items-center justify-center px-3 py-2 hover:bg-[color-mix(in_srgb,var(--color-controlsBlur)_80%,transparent)] md:px-4 md:py-2.5",
              disabled && "cursor-not-allowed opacity-60",
            )}
          >
            <span
              className={cn(
                "flex min-w-0 items-center transition-all duration-300 ease-in-out",
                active ? "w-full justify-start gap-3" : "w-auto justify-center gap-0",
              )}
            >
              {item.icon ? (
                <span
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors duration-200 md:h-6 md:w-6",
                    active ? "text-primaryText" : "text-[#64748B]",
                  )}
                >
                  {item.icon}
                </span>
              ) : null}
              <span
                className={cn(
                  "overflow-hidden whitespace-nowrap font-medium text-primaryText transition-all duration-300 ease-in-out md:text-sm md:leading-5",
                  "text-[10px] leading-[14px]",
                  active ? "ml-0 max-w-[200px] opacity-100" : "ml-0 max-w-0 opacity-0",
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
