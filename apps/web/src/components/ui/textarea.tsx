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
        "min-h-[96px] w-full resize-y rounded-2xl border bg-mos-bg/60 px-3 py-2.5 text-sm text-mos-text outline-none backdrop-blur-sm placeholder:text-mos-muted",
        error ? "border-mos-danger" : "border-mos-line/40 focus:border-mos-amber",
        disabled && "opacity-60",
        className,
      )}
      onChange={(event) => onValueChange?.(event.target.value)}
    />
  );
}
