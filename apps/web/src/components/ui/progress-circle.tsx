"use client";

import CharacterAvatar from "@/components/character-avatar";
import type { GenderId } from "@/lib/avatars";
import type { OgCharacterId } from "@/lib/characters";
import { cn } from "@/lib/utils";

type ProgressCircleProps = {
  progress: number;
  selectedSkinId?: OgCharacterId;
  gender?: GenderId;
  imageSrc?: string | null;
  fallbackLetter?: string;
  size?: "sm" | "lg";
  className?: string;
  showPercentage?: boolean;
  progressColor?: string;
  backgroundColor?: string;
  width?: number;
  onAvatarClick?: () => void;
  isUploading?: boolean;
};

export default function ProgressCircle({
  progress,
  selectedSkinId,
  gender = "MALE",
  imageSrc,
  fallbackLetter,
  size = "sm",
  className,
  showPercentage = true,
  progressColor = "#d4a84b",
  backgroundColor = "rgba(255,255,255,0.1)",
  width = 3,
  onAvatarClick,
  isUploading = false,
}: ProgressCircleProps) {
  const svgSize = size === "sm" ? 70 : 162;
  const radius = svgSize / 2 - 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, progress));
  const strokeDasharray = `${(clamped / 100) * circumference} ${circumference}`;
  const canChangeAvatar = Boolean(onAvatarClick) && !isUploading;

  const avatarClassName = cn(
    "rounded-full transition-transform duration-200",
    size === "sm"
      ? "h-[41px] w-[41px] md:h-[57px] md:w-[57px]"
      : "h-[118px] w-[118px] md:h-[143px] md:w-[143px]",
    canChangeAvatar && "group-hover/avatar:scale-[1.03]",
  );

  const avatar = (
    <CharacterAvatar
      selectedSkinId={selectedSkinId}
      gender={gender}
      imageSrc={imageSrc}
      fallbackLetter={fallbackLetter}
      preferUploadedAvatar
      variant="head"
      className={avatarClassName}
      imageClassName="object-cover object-center"
    />
  );

  return (
    <div
      className={cn(
        "group/avatar relative shrink-0",
        size === "sm" ? "h-[50px] w-[50px] md:h-[70px] md:w-[70px]" : "h-[134px] w-[134px] md:h-[162px] md:w-[162px]",
        className,
      )}
    >
      {canChangeAvatar ? (
        <button
          type="button"
          onClick={onAvatarClick}
          aria-label="Сменить фото"
          className="relative flex h-full w-full cursor-pointer items-center justify-center overflow-hidden rounded-full bg-transparent focus-visible:outline-none"
        >
          {avatar}
          <ChangeAvatarOverlay size={size} label="Сменить фото" />
        </button>
      ) : (
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full">
          {avatar}
        </div>
      )}

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

      {isUploading ? (
        <div
          className="absolute inset-0 z-[5] flex items-center justify-center rounded-full bg-black/45"
          aria-busy
          aria-label="Загрузка аватара"
        >
          <span
            className={cn(
              "animate-spin rounded-full border-2 border-white/30 border-t-white",
              size === "sm" ? "h-6 w-6" : "h-9 w-9 md:h-11 md:w-11",
            )}
          />
        </div>
      ) : null}

      {showPercentage && !isUploading ? (
        <div
          className={cn(
            "absolute bottom-0 left-1/2 z-[6] flex -translate-x-1/2 items-center justify-center border border-mos-line bg-gradient-controls-primary-active px-1.5 md:px-2",
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

function ChangeAvatarOverlay({ size, label }: { size: "sm" | "lg"; label: string }) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute inset-[8%] z-[4] flex flex-col items-center justify-center gap-1 rounded-full",
        "bg-black/0 opacity-0 transition-all duration-200",
        "group-hover/avatar:bg-black/50 group-hover/avatar:opacity-100",
        "group-focus-within/avatar:bg-black/50 group-focus-within/avatar:opacity-100",
      )}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        className={cn("text-mos-text", size === "sm" ? "h-4 w-4" : "h-6 w-6 md:h-7 md:w-7")}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      >
        <path
          d="M4 8h3l1.5-2h7L17 8h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="13" r="3.5" />
      </svg>
      {size === "lg" ? (
        <span className="max-w-[80%] text-center font-golos text-[10px] font-medium leading-3 text-mos-text md:text-xs md:leading-4">
          {label}
        </span>
      ) : null}
    </span>
  );
}
