"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import ActiveTalentPopup from "@/components/talents/active-popup";
import PassiveTalentPopup from "@/components/talents/passive-popup";
import { COIN_SRC } from "@/components/ui/gold-coin";
import { canOptimizeImageSrc } from "@/lib/image-src";
import type { MosTalent, TalentTreeType } from "@/lib/talents-catalog";
import { TREE_BORDER_COLOR } from "@/lib/talents-catalog";
import { cn } from "@/lib/utils";

function TalentIcon({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [imageSrc, setImageSrc] = useState(src);

  useEffect(() => {
    setImageSrc(src);
  }, [src]);

  return (
    <Image
      src={imageSrc}
      alt={alt}
      fill
      sizes="(max-width: 767px) 32px, (max-width: 2399px) 60px, 90px"
      className={cn("object-cover", className)}
      loading="lazy"
      unoptimized={!canOptimizeImageSrc(imageSrc)}
      onError={() => setImageSrc(COIN_SRC)}
    />
  );
}

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
      <div className={cn("relative mx-auto w-6 md:w-[60px] min-[2400px]:w-[90px]", className)}>
        <div
          className="relative z-20 h-6 w-6 overflow-hidden rounded-full border-2 bg-mos-stone shadow-lg md:h-[60px] md:w-[60px] min-[2400px]:h-[90px] min-[2400px]:w-[90px]"
          style={{ borderColor }}
        >
          <TalentIcon src={talent.imageUrl} alt={talent.name} />
          {!talent.isLearned ? <div className="absolute inset-0 rounded-full bg-black/50" /> : null}
          {talent.type === "ACTIVE_TYPE" ? (
            <CooldownOverlay
              cooldownUntil={talent.cooldownUntil}
              cooldownTimeSeconds={talent.cooldownSeconds}
              className="z-10 rounded-full"
            />
          ) : null}
        </div>
        <div className="absolute left-1/2 top-[19px] z-20 flex h-2.5 w-6 -translate-x-1/2 items-center justify-center gap-px rounded border border-white/10 bg-mos-stone px-0.5 shadow-md backdrop-blur-md md:top-[46px] md:h-5 md:w-[60px] md:rounded-lg md:border-2 md:px-1 min-[2400px]:top-[69px] min-[2400px]:h-[30px] min-[2400px]:w-[90px]">
          <span className="font-display text-[6px] font-bold uppercase leading-none text-mos-text md:text-sm min-[2400px]:text-[21px]">
            {talent.tier}/{talent.maxTier}
          </span>
        </div>
      </div>
    ) : (
      <div className={cn("relative inline-flex shrink-0", className)}>
        <div className="relative h-8 w-8 overflow-hidden rounded-full md:h-[60px] md:w-[60px] min-[2400px]:h-[90px] min-[2400px]:w-[90px]">
          <TalentIcon src={talent.imageUrl} alt={talent.name} />
          {talent.type === "ACTIVE_TYPE" ? (
            <CooldownOverlay
              cooldownUntil={talent.cooldownUntil}
              cooldownTimeSeconds={talent.cooldownSeconds}
              className="rounded-full"
            />
          ) : null}
        </div>
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
