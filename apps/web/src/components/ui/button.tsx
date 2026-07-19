"use client";

import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

const variantClasses = {
  primary: "og-btn-primary",
  magenta: "og-btn-magenta",
  secondary: "og-btn-secondary",
  stroke: "og-btn-stroke",
  ghost: "og-btn-ghost",
  filled: "og-btn-filled",
} as const;

const sizeClasses = {
  sm: "og-btn-sm",
  md: "og-btn-md",
  lg: "og-btn-lg",
} as const;

export type ButtonVariant = keyof typeof variantClasses;
export type ButtonSize = keyof typeof sizeClasses;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
}

export default function Button({
  variant = "primary",
  size = "lg",
  className,
  type = "button",
  href,
  children,
  ...rest
}: ButtonProps) {
  const { style, disabled, onClick, ...buttonRest } = rest;
  const classes = cn("og-btn", variantClasses[variant], sizeClasses[size], className);
  if (href) {
    return (
      <a href={href} className={classes} style={style} aria-disabled={disabled || undefined} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <button type={type} className={classes} style={style} disabled={disabled} onClick={onClick} {...buttonRest}>
      {children}
    </button>
  );
}
