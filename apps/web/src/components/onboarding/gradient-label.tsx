import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type GradientLabelProps = {
  children: ReactNode;
  className?: string;
};

export default function GradientLabel({ children, className }: GradientLabelProps) {
  return (
    <div className={cn("flex w-full flex-col items-start justify-start", className)}>
      <div className="h-0.5 w-full bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,_#d4a84b_0%,_rgba(212,_168,_75,_0)_100%)]" />
      <div className="flex w-full items-center justify-center gap-2.5 bg-[radial-gradient(ellipse_50%_280%_at_50%_50%,_#141416_0%,_rgba(20,_20,_22,_0)_100%)] px-4 py-1">
        {children}
      </div>
      <div className="h-0.5 w-full self-stretch bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,_#d4a84b_0%,_rgba(212,_168,_75,_0)_100%)]" />
    </div>
  );
}
