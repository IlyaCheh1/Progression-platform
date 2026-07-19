"use client";

import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

const variantClasses = {
  primary: "og-btn-primary",
  magenta: "og-btn-magenta",
  secondary: "og-btn-secondary",
  stroke: "og-btn-stroke",
  ghost: "og-btn-ghost",
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
  const classes = cn("og-btn", variantClasses[variant], sizeClasses[size], className);
  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }
  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  );
}
