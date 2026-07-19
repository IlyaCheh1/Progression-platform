"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type AchievementState = "ongoing" | "claimable" | "completed";

function PinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2Z" />
    </svg>
  );
}

function CheckBadge({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1.1 14.2-3.6-3.6 1.4-1.4 2.2 2.2 5-5 1.4 1.4-6.4 6.4Z" />
    </svg>
  );
}

type AchievementShellProps = {
  state: AchievementState;
  pinned: boolean;
  onPin?: () => void;
  iconUrl?: string;
  title: string;
  description: string;
  middle?: ReactNode;
  footer?: ReactNode;
  badge: ReactNode;
  className?: string;
};

export default function AchievementShell({
  state,
  pinned,
  onPin,
  iconUrl,
  title,
  description,
  middle,
  footer,
  badge,
  className,
}: AchievementShellProps) {
  const isCompleted = state === "completed";
  const isClaimable = state === "claimable";

  return (
    <div
      className={cn(
        "group relative w-full rounded-3xl p-[2px]",
        isClaimable && "bg-gradient-achievements-claimable",
        isCompleted && "bg-gradient-achievements-completed",
      )}
    >
      <div className={cn("bg-secondaryBg relative w-full rounded-3xl", className)}>
        {onPin && !isCompleted ? (
          <button
            type="button"
            onClick={onPin}
            className={cn(
              "absolute left-4 top-4 z-10 rounded-lg bg-white/5 p-1.5 opacity-0 backdrop-blur-md transition-all duration-300 group-hover:opacity-100 hover:bg-white/10",
              pinned && "opacity-100",
            )}
            aria-label={pinned ? "Открепить" : "Закрепить"}
          >
            <PinIcon className={cn("h-4 w-4 md:h-6 md:w-6", pinned ? "text-mos-amber" : "text-mos-text")} />
          </button>
        ) : null}

        <div className="relative flex w-full items-center gap-3 overflow-hidden p-3 md:gap-6 md:px-6 md:py-5">
          <div className="flex min-w-0 flex-1 items-start gap-3 md:gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-mos-stone md:h-28 md:w-28 md:rounded-[20px]">
              {iconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- content icons from public/CDN
                <img
                  src={iconUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="grid h-full w-full place-items-center font-display text-xl text-mos-amber">
                  {title.slice(0, 1)}
                </div>
              )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-5">
              <div className="flex flex-col gap-2">
                <h3 className="font-display text-[10px] font-medium leading-3 text-mos-text md:text-[15px] md:leading-6">
                  {title}
                </h3>
                <p className="font-golos text-[10px] leading-3.5 text-mos-muted md:text-sm md:leading-5">
                  {description}
                </p>
                {middle}
              </div>
              {footer}
            </div>
          </div>

          {badge}

          {state === "claimable" ? (
            <div className="bg-controlsBlur absolute left-4 top-4 flex items-center rounded-lg p-1.5 backdrop-blur-md">
              <div className="h-4 w-4 rounded-full bg-mos-amber" />
            </div>
          ) : null}
          {state === "completed" ? (
            <div className="bg-controlsBlur absolute left-4 top-4 flex items-center justify-center rounded-lg p-1.5 backdrop-blur-md">
              <CheckBadge className="h-5 w-5 text-[#7dba5a]" />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function CompletedBar() {
  return (
    <div className="bg-controlsInactive flex w-full items-center justify-center overflow-hidden rounded-lg p-1 opacity-60">
      <span className="font-display text-[10px] font-medium uppercase tracking-[0.5px] text-[#7dba5a]">
        получено
      </span>
    </div>
  );
}

export function RewardBadge({
  value,
  label = "XP",
  kind = "xp",
  claimable,
  onClick,
}: {
  value: number | string;
  label?: string;
  kind?: "xp" | "coins";
  claimable?: boolean;
  onClick?: () => void;
}) {
  const resolvedLabel = kind === "coins" ? "золото" : label;

  return (
    <button
      type="button"
      onClick={claimable ? onClick : undefined}
      disabled={!claimable}
      className={cn(
        "bg-controlsBlur flex w-[60px] shrink-0 flex-col items-center justify-end gap-0.5 rounded-xl p-1 backdrop-blur-sm transition-opacity hover:opacity-80 disabled:cursor-default md:w-20 md:rounded-[20px] md:p-2",
        claimable && "bg-mos-amber text-mos-bg",
      )}
    >
      <span
        className={cn(
          "inline-flex items-center gap-0.5 font-display text-[8px] font-bold uppercase md:text-[10px]",
          claimable ? "text-mos-bg" : "text-mos-muted",
        )}
      >
        {kind === "coins" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/media/ui/coin.png" alt="" className="h-3 w-3 object-contain md:h-3.5 md:w-3.5" />
        ) : null}
        {resolvedLabel}
      </span>
      <span
        className={cn(
          "text-center font-display text-[10px] font-medium leading-3.5 md:text-[15px] md:leading-6",
          claimable ? "text-mos-bg" : kind === "coins" ? "text-mos-amber" : "text-mos-text",
        )}
      >
        {typeof value === "number" ? `+${value}` : value}
      </span>
    </button>
  );
}
