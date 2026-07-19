"use client";

import { cn } from "@/lib/utils";

type AppearanceEditBadgeProps = {
  label: string;
  className?: string;
};

export default function AppearanceEditBadge({ label, className }: AppearanceEditBadgeProps) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute flex items-center gap-1 rounded-lg bg-black/65 px-2 py-1 font-golos text-[10px] font-medium text-mos-text opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 md:text-xs",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.75">
        <path
          d="M4 8h3l1.5-2h7L17 8h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="13" r="3.5" />
      </svg>
      {label}
    </span>
  );
}
