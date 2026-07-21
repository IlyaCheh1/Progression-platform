"use client";

import { useEffect, useState, type ReactNode } from "react";
import PopupMenu from "@/components/ui/popup-menu";
import { useMobileMedia } from "@/hooks/landing/useMobileMedia";
import type { MosTalent } from "@/lib/talents-catalog";

function StopwatchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M9 2h6v2h-2v1.1A8 8 0 1 1 10 5.1V4H9V2Zm3 5a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm-1 2h2v4.2l2.4 1.4-.9 1.5L11 13.2V9Z" />
    </svg>
  );
}

type Props = {
  talent: MosTalent;
  children: ReactNode;
  onActivate?: () => void;
  onToggleFavorite?: () => void;
  onLearn?: () => void;
  canBeLearned?: boolean;
  loading?: { activate?: boolean; favorite?: boolean; learn?: boolean };
  placement?: "bottom" | "bottom-left" | "bottom-right";
};

export default function ActiveTalentPopup({
  talent,
  children,
  onActivate,
  onToggleFavorite,
  onLearn,
  canBeLearned = true,
  loading,
  placement = "bottom",
}: Props) {
  const isMobile = useMobileMedia();
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!talent.cooldownUntil) {
      setTimeLeft("");
      return;
    }
    const tick = () => {
      const diff = new Date(talent.cooldownUntil!).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("");
        return;
      }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(
        days > 0
          ? `${days} дн, ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
          : `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [talent.cooldownUntil]);

  const isLearned = talent.isLearned;
  const isOnCooldown = Boolean(talent.cooldownUntil && timeLeft);

  return (
    <PopupMenu
      trigger={children}
      placement={placement}
      margin={10}
      hover={!isMobile}
      isOverlay={isMobile}
    >
      <div className="flex w-fit max-w-[250px] flex-col gap-4 rounded-2xl bg-mos-stone p-3 backdrop-blur-md md:rounded-[20px] md:p-4">
        <div className="flex flex-col gap-2">
          <div className="flex h-5 w-fit items-center rounded-md bg-white/10 px-1">
            <span className="font-golos text-[10px] font-medium text-mos-muted md:text-xs">
              {!isLearned ? "Недоступно" : "Активное умение"}
            </span>
          </div>
          <h3 className="font-display text-[10px] font-medium text-mos-text md:text-[15px] md:leading-6">
            {talent.name}
          </h3>
          <p className="font-golos text-[10px] text-mos-text md:text-sm md:leading-5">{talent.description}</p>
        </div>

        {isOnCooldown && isLearned ? (
          <div className="flex flex-col gap-2 border-t border-white/10 pt-3">
            <span className="font-golos text-[10px] text-mos-muted md:text-sm">Будет доступно через:</span>
            <div className="flex items-center gap-2">
              <StopwatchIcon className="h-4 w-4 shrink-0 text-mos-amber" />
              <span className="font-golos text-sm font-medium text-mos-text">{timeLeft}</span>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-3">
          {!isOnCooldown && !talent.isActivated && isLearned ? (
            <button
              type="button"
              disabled={loading?.activate}
              onClick={onActivate}
              className="og-btn og-btn-primary og-btn-sm w-full uppercase"
            >
              активировать
            </button>
          ) : null}
          {isLearned ? (
            <button
              type="button"
              disabled={loading?.favorite}
              onClick={onToggleFavorite}
              className="og-btn og-btn-secondary og-btn-sm w-full uppercase"
            >
              {talent.isFavorite ? "убрать из избранного" : "в избранное"}
            </button>
          ) : null}
          {!isLearned && canBeLearned ? (
            <button
              type="button"
              disabled={loading?.learn}
              onClick={onLearn}
              className="og-btn og-btn-secondary og-btn-sm w-full uppercase"
            >
              изучить
            </button>
          ) : null}
        </div>
      </div>
    </PopupMenu>
  );
}
