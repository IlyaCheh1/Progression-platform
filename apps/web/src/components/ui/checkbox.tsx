"use client";

import { cn } from "@/lib/utils";

type CheckboxProps = {
  id?: string;
  label: string;
  checked: boolean;
  onChange?: (checked: boolean) => void;
  onClick?: () => void;
  size?: "md" | "lg";
  name?: string;
  value?: string;
};

export default function Checkbox({
  id,
  label,
  checked,
  onChange,
  onClick,
  size = "md",
}: CheckboxProps) {
  return (
    <button
      type="button"
      id={id}
      role="checkbox"
      aria-checked={checked}
      onClick={() => {
        onClick?.();
        onChange?.(!checked);
      }}
      className="inline-flex items-center gap-2 text-left"
    >
      <span
        className={cn(
          "grid place-items-center rounded-md border transition-colors",
          size === "lg" ? "h-6 w-6" : "h-5 w-5",
          checked ? "border-mos-amber bg-mos-amber text-mos-bg" : "border-mos-line/50 bg-transparent text-transparent",
        )}
      >
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
          <path d="M6.2 11.4 2.8 8l1.2-1.2 2.2 2.2 5-5L12.4 5.2 6.2 11.4Z" />
        </svg>
      </span>
      <span className={cn("text-mos-text", size === "lg" ? "text-sm" : "text-xs")}>{label}</span>
    </button>
  );
}
