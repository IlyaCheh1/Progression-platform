"use client";

import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type TextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> & {
  onValueChange?: (value: string) => void;
  error?: boolean;
};

export default function Textarea({
  className,
  onValueChange,
  error,
  disabled,
  ...props
}: TextareaProps) {
  return (
    <textarea
      {...props}
      disabled={disabled}
      className={cn(
        "min-h-[96px] w-full resize-y rounded-2xl px-3 py-2.5 text-sm text-mos-text outline-none placeholder:text-mos-muted",
        disabled ? "bg-transparent opacity-60" : "bg-controlsBlur",
        error && "ring-1 ring-mos-danger",
        className,
      )}
      onChange={(event) => onValueChange?.(event.target.value)}
    />
  );
}
