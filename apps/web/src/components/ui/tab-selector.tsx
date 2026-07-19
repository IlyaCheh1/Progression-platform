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

/**
 * Inventory filter tabs.
 * Icons stay in fixed slots (neighbors never shift on click);
 * the active label sits beside the icon row so the bar width hugs content.
 */
export default function TabSelector({
  items,
  activeId,
  onChange,
  className,
  isLoading,
}: TabSelectorProps) {
  const activeItem = items.find((item) => item.id === activeId) ?? items[0];

  return (
    <div
      className={cn(
        "box-border inline-flex w-max max-w-full items-center gap-2 rounded-[24px] bg-[#141416] p-1 backdrop-blur-[25px] md:gap-3 md:px-3 md:py-2",
        className,
      )}
      role="tablist"
    >
      <div className="flex shrink-0 items-center gap-2 md:gap-3">
        {items.map((item) => {
          const active = item.id === activeId;
          const disabled = item.disabled || isLoading;

          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={item.label}
              disabled={disabled}
              onClick={() => {
                if (disabled || active) return;
                onChange(item.id);
              }}
              className={cn(
                "box-border flex h-10 w-11 shrink-0 select-none items-center justify-center rounded-2xl md:h-11 md:w-12",
                "transition-colors duration-200 ease-out",
                active
                  ? "bg-[var(--color-controlsBlur)] text-primaryText"
                  : "text-[#64748B] hover:bg-[color-mix(in_srgb,var(--color-controlsBlur)_80%,transparent)]",
                disabled && "cursor-not-allowed opacity-60",
              )}
            >
              {item.icon ? (
                <span className="h-4 w-4 shrink-0 md:h-6 md:w-6">{item.icon}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {activeItem ? (
        <span className="min-w-0 truncate pr-2 font-medium text-[10px] leading-[14px] text-primaryText md:pr-1 md:text-sm md:leading-5">
          {activeItem.label}
        </span>
      ) : null}
    </div>
  );
}
