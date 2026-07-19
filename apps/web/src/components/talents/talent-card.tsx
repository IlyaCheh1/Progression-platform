"use client";

import { useEffect, useState } from "react";
import ActiveTalentPopup from "@/components/talents/active-popup";
import PassiveTalentPopup from "@/components/talents/passive-popup";
import type { MosTalent, TalentTreeType } from "@/lib/talents-catalog";
import { TREE_BORDER_COLOR } from "@/lib/talents-catalog";
import { cn } from "@/lib/utils";

function CooldownOverlay({
  cooldownUntil,
  cooldownTimeSeconds,
  className,
}: {
  cooldownUntil?: string;
  cooldownTimeSeconds?: number;
  className?: string;
}) {
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    if (!cooldownUntil || !cooldownTimeSeconds) {
      setPercent(0);
      return;
    }
    const tick = () => {
      const remaining = Math.max(0, new Date(cooldownUntil).getTime() - Date.now());
      setPercent(Math.min(100, (remaining / (cooldownTimeSeconds * 1000)) * 100));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [cooldownUntil, cooldownTimeSeconds]);

  if (percent <= 0) return null;
  const darkAngle = (percent / 100) * 360;
  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      <div
        className="absolute inset-0"
        style={{
          background: `conic-gradient(from 0deg, rgba(0,0,0,0.6) 0deg, rgba(0,0,0,0.6) ${darkAngle}deg, transparent ${darkAngle}deg)`,
        }}
      />
    </div>
  );
}

type TalentCardProps = {
  talent: MosTalent;
  variant?: "primary" | "secondary";
  treeType?: TalentTreeType;
  canBeLearned?: boolean;
  onActivate?: () => void;
  onLearn?: () => void;
  onFavourite?: () => void;
  loading?: { activate: boolean; favorite: boolean; learn: boolean };
  className?: string;
  placement?: "bottom" | "bottom-left" | "bottom-right";
};

export default function TalentCard({
  talent,
  variant = "secondary",
  treeType = "blade",
  canBeLearned = false,
  onActivate,
  onLearn,
  onFavourite,
  loading,
  className,
  placement = "bottom",
}: TalentCardProps) {
  const borderColor = talent.isFavorite ? TREE_BORDER_COLOR[treeType] : "rgba(255,255,255,0.2)";

  const image =
    variant === "secondary" ? (
      <div className={cn("relative mx-auto w-8 md:w-[60px] min-[2400px]:w-[90px]", className)}>
        <div
          className="relative z-20 h-8 w-8 overflow-hidden rounded-full border-2 bg-mos-stone shadow-lg md:h-[60px] md:w-[60px] min-[2400px]:h-[90px] min-[2400px]:w-[90px]"
          style={{ borderColor }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={talent.imageUrl}
            alt={talent.name}
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.src = "/media/ui/coin.png";
            }}
          />
          {!talent.isLearned ? <div className="absolute inset-0 rounded-full bg-black/50" /> : null}
          {talent.type === "ACTIVE_TYPE" ? (
            <CooldownOverlay
              cooldownUntil={talent.cooldownUntil}
              cooldownTimeSeconds={talent.cooldownSeconds}
              className="z-10 rounded-full"
            />
          ) : null}
        </div>
        <div className="absolute left-1/2 top-[26px] z-20 flex h-3 w-8 -translate-x-1/2 items-center justify-center gap-px rounded border-2 border-white/10 bg-mos-stone px-1 shadow-md backdrop-blur-md md:top-[46px] md:h-5 md:w-[60px] md:rounded-lg min-[2400px]:top-[69px] min-[2400px]:h-[30px] min-[2400px]:w-[90px]">
          <span className="font-display text-[8px] font-bold uppercase text-mos-text md:text-sm min-[2400px]:text-[21px]">
            {talent.tier}/{talent.maxTier}
          </span>
        </div>
      </div>
    ) : (
      <div className={cn("relative", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={talent.imageUrl}
          alt={talent.name}
          className="h-8 w-8 rounded-full object-cover md:h-[60px] md:w-[60px] min-[2400px]:h-[90px] min-[2400px]:w-[90px]"
          onError={(e) => {
            e.currentTarget.src = "/media/ui/coin.png";
          }}
        />
        {talent.type === "ACTIVE_TYPE" ? (
          <CooldownOverlay
            cooldownUntil={talent.cooldownUntil}
            cooldownTimeSeconds={talent.cooldownSeconds}
            className="rounded-full"
          />
        ) : null}
      </div>
    );

  if (talent.type === "ACTIVE_TYPE") {
    return (
      <ActiveTalentPopup
        talent={talent}
        onActivate={onActivate}
        onToggleFavorite={onFavourite}
        onLearn={onLearn}
        canBeLearned={canBeLearned}
        loading={loading}
        placement={placement}
      >
        {image}
      </ActiveTalentPopup>
    );
  }

  return (
    <PassiveTalentPopup
      talent={talent}
      onLearn={onLearn}
      canBeLearned={canBeLearned}
      loading={loading}
      placement={placement}
    >
      {image}
    </PassiveTalentPopup>
  );
}
