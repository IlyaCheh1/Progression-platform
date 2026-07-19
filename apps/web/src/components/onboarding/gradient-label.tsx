import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type GradientLabelColor = "amber" | "green" | "blue" | "orange";

const GRADIENT: Record<GradientLabelColor, string> = {
  amber:
    "bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,_#d4a84b_0%,_rgba(212,_168,_75,_0)_100%)]",
  green:
    "bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,_#31D053_0%,_rgba(49,_208,_83,_0)_100%)]",
  blue: "bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,_#2D68FF_0%,_rgba(45,_104,_255,_0)_100%)]",
  orange:
    "bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,_#EE4810_0%,_rgba(238,_72,_16,_0)_100%)]",
};

type GradientLabelProps = {
  children: ReactNode;
  className?: string;
  color?: GradientLabelColor;
};

export default function GradientLabel({
  children,
  className,
  color = "amber",
}: GradientLabelProps) {
  return (
    <div className={cn("flex w-full flex-col items-start justify-start", className)}>
      <div className={cn("h-0.5 w-full", GRADIENT[color])} />
      <div className="flex w-full items-center justify-center gap-2.5 bg-[radial-gradient(ellipse_50%_280%_at_50%_50%,_#141416_0%,_rgba(20,_20,_22,_0)_100%)] px-4 py-1">
        {children}
      </div>
      <div className={cn("h-0.5 w-full self-stretch", GRADIENT[color])} />
    </div>
  );
}
