"use client";

import CharacterAvatar from "@/components/character-avatar";
import type { GenderId } from "@/lib/avatars";
import type { OgCharacterId } from "@/lib/characters";
import { cn } from "@/lib/utils";

type ProgressCircleProps = {
  progress: number;
  selectedSkinId?: OgCharacterId;
  gender?: GenderId;
  size?: "sm" | "lg";
  className?: string;
  showPercentage?: boolean;
  progressColor?: string;
  backgroundColor?: string;
  width?: number;
};

export default function ProgressCircle({
  progress,
  selectedSkinId,
  gender = "MALE",
  size = "sm",
  className,
  showPercentage = true,
  progressColor = "#d4a84b",
  backgroundColor = "rgba(255,255,255,0.1)",
  width = 3,
}: ProgressCircleProps) {
  const svgSize = size === "sm" ? 70 : 162;
  const radius = svgSize / 2 - 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, progress));
  const strokeDasharray = `${(clamped / 100) * circumference} ${circumference}`;

  return (
    <div
      className={cn(
        "relative shrink-0",
        size === "sm" ? "h-[50px] w-[50px] md:h-[70px] md:w-[70px]" : "h-[134px] w-[134px] md:h-[162px] md:w-[162px]",
        className,
      )}
    >
      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full">
        {selectedSkinId ? (
          <CharacterAvatar
            selectedSkinId={selectedSkinId}
            gender={gender}
            variant="head"
            className={cn(
              "rounded-full",
              size === "sm"
                ? "h-[41px] w-[41px] md:h-[57px] md:w-[57px]"
                : "h-[118px] w-[118px] md:h-[143px] md:w-[143px]",
            )}
            imageClassName="object-cover object-top"
          />
        ) : (
          <div className="h-[80%] w-[80%] rounded-full bg-mos-stone" />
        )}
      </div>

      <svg
        className="pointer-events-none absolute inset-0 h-full w-full rotate-90 overflow-visible"
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        aria-hidden
      >
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={width}
          fill="none"
        />
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          stroke={progressColor}
          strokeWidth={width}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>

      {showPercentage ? (
        <div
          className={cn(
            "absolute bottom-0 left-1/2 z-[5] flex -translate-x-1/2 items-center justify-center border border-mos-line bg-gradient-controls-primary-active px-1.5 md:px-2",
            size === "sm"
              ? "min-w-[30px] translate-y-0.5 rounded-sm md:min-w-[42px]"
              : "h-5 min-w-[34px] translate-y-1.5 rounded-2xl md:w-[42px]",
          )}
        >
          <p className="font-display text-[7px] font-bold leading-none text-mos-bg md:text-[10px]">
            {Math.round(clamped)}%
          </p>
        </div>
      ) : null}
    </div>
  );
}
