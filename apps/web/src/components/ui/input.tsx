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
        "relative flex h-11 w-full items-center rounded-2xl px-3 transition-colors",
        disabled ? "bg-transparent opacity-60" : "bg-controlsBlur",
        error && "ring-1 ring-mos-danger",
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
