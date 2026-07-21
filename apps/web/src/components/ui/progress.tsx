import { cn } from "@/lib/utils";

type ProgressSize = "sm" | "md" | "lg" | "xl" | "achievement";

const sizeTrack: Record<ProgressSize, string> = {
  sm: "h-0.5 px-0.5 xl:h-1 xl:px-1",
  md: "h-1.5 px-1 xl:h-2 xl:px-1.5",
  lg: "h-2.5 px-1.5 xl:h-3 xl:px-2",
  xl: "h-3 px-2 xl:h-4 xl:px-2.5",
  achievement: "h-2 px-1 xl:h-2.5 xl:px-1.5",
};

const sizeBar: Record<ProgressSize, string> = {
  sm: "h-0.5 rounded xl:h-1",
  md: "h-1.5 rounded-[10px] xl:h-2 xl:rounded-xl",
  lg: "h-2.5 rounded-2xl xl:h-3",
  xl: "h-3 rounded-[20px] xl:h-4 xl:rounded-3xl",
  achievement: "h-2 rounded-xl xl:h-2.5 xl:rounded-3xl",
};

const sizeText: Record<ProgressSize, string> = {
  sm: "text-[4px] xl:text-[8px] font-display",
  md: "text-[6px] xl:text-[10px] font-display",
  lg: "text-[8px] xl:text-xs font-display",
  xl: "text-[10px] xl:text-xs font-golos",
  achievement: "text-[8px] xl:text-[10px] font-display",
};

export type ProgressProps = {
  value: number;
  max: number;
  className?: string;
  size?: ProgressSize;
  showText?: boolean;
  suffix?: string;
  barClassName?: string;
};

export default function Progress({
  value,
  max,
  className,
  size = "md",
  showText = false,
  suffix,
  barClassName = "bg-mos-amber",
}: ProgressProps) {
  const safeMax = max > 0 ? max : 1;
  const percent = Math.min(100, Math.max(0, (value / safeMax) * 100));

  return (
    <div
      className={cn(
        "relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-white/10",
        sizeTrack[size],
        className,
      )}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        className={cn("absolute left-0 top-0 transition-all duration-300", sizeBar[size], barClassName)}
        style={{ width: `${percent}%` }}
      />
      {showText ? (
        <div
          className={cn(
            "relative z-10 flex items-center gap-1 font-medium uppercase tracking-wide text-mos-text",
            sizeText[size],
          )}
        >
          <span>{value}</span>
          <span>/</span>
          <span>{max}</span>
          {suffix ? <span>{suffix}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
