"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type SelectOption = { value: string; label: string };

type SelectFieldProps = {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function SelectField({
  options,
  value,
  onChange,
  placeholder,
  className,
  disabled,
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((option) => option.value === value);
  const label = selected?.label ?? placeholder ?? "";

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function selectOption(next: string) {
    onChange(next);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          if (!disabled) setOpen((prev) => !prev);
        }}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-2 rounded-2xl px-3 text-left text-sm text-mos-text outline-none transition-colors",
          disabled ? "bg-transparent opacity-60" : "bg-controlsBlur hover:bg-white/[0.08]",
          open && "ring-1 ring-mos-amber/35",
        )}
      >
        <span className={cn("truncate", !selected && "text-mos-muted")}>{label}</span>
        <ChevronIcon
          className={cn(
            "h-4 w-4 shrink-0 text-mos-muted transition-transform duration-200",
            open && "rotate-180 text-mos-amber",
          )}
        />
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 flex max-h-60 flex-col gap-0.5 overflow-y-auto rounded-2xl border border-[var(--color-strokeBg)] bg-[var(--color-tertiaryBg)] p-1.5 shadow-2xl backdrop-blur-xl"
        >
          {options.map((option) => {
            const active = option.value === value;
            return (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={cn(
                    "flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                    active
                      ? "bg-white/10 font-medium text-mos-amber"
                      : "text-mos-text hover:bg-white/5 hover:text-mos-amber",
                  )}
                  onClick={() => selectOption(option.value)}
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
