"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
  onValueChange?: (value: string) => void;
  suffix?: ReactNode;
  error?: boolean;
};

export default function Input({
  className,
  onValueChange,
  suffix,
  error,
  disabled,
  ...props
}: InputProps) {
  return (
    <div
      className={cn(
        "relative flex h-11 w-full items-center rounded-2xl border bg-mos-bg/60 px-3 backdrop-blur-sm transition-colors",
        error ? "border-mos-danger" : "border-mos-line/40 focus-within:border-mos-amber",
        disabled && "opacity-60",
        className,
      )}
    >
      <input
        {...props}
        disabled={disabled}
        className="h-full w-full bg-transparent text-sm text-mos-text outline-none placeholder:text-mos-muted"
        onChange={(event) => onValueChange?.(event.target.value)}
      />
      {suffix ? <div className="ml-2 shrink-0">{suffix}</div> : null}
    </div>
  );
}
