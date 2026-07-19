"use client";

import {
  characterAvatarPath,
  characterFullPath,
  characterInitial,
  getCharacterById,
  normalizeSelectedSkinId,
} from "@/lib/characters";
import type { GenderId } from "@/lib/avatars";
import { backgroundImagePath } from "@/lib/backgrounds";
import { cn } from "@/lib/utils";

type CharacterAvatarProps = {
  selectedSkinId?: string | null;
  gender: GenderId;
  variant?: "head" | "full";
  className?: string;
  imageClassName?: string;
};

export default function CharacterAvatar({
  selectedSkinId,
  gender,
  variant = "head",
  className,
  imageClassName,
}: CharacterAvatarProps) {
  const src = variant === "full" ? characterFullPath(selectedSkinId, gender) : characterAvatarPath(selectedSkinId, gender);
  const character = getCharacterById(normalizeSelectedSkinId(selectedSkinId, gender));

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        variant === "head" ? "rounded-2xl" : "rounded-none",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={character?.name ?? "Персонаж"}
        className={cn("h-full w-full object-contain", imageClassName)}
        onError={(event) => {
          const target = event.currentTarget;
          target.style.display = "none";
          const fallback = target.nextElementSibling as HTMLElement | null;
          if (fallback) fallback.style.display = "grid";
        }}
      />
      <div
        className="hidden h-full w-full place-items-center bg-mos-stone/70 font-display text-2xl text-mos-amber"
        aria-hidden
      >
        {characterInitial(selectedSkinId, gender)}
      </div>
    </div>
  );
}

export function useAvatarPresentation(profile?: {
  selectedSkinId?: string | null;
  skin?: string | null;
  gender?: string | null;
  backgroundKey?: string | null;
}) {
  const gender: GenderId = profile?.gender === "FEMALE" ? "FEMALE" : "MALE";
  const selectedSkinId = normalizeSelectedSkinId(profile?.selectedSkinId ?? profile?.skin, gender);
  const character = getCharacterById(selectedSkinId);

  return {
    selectedSkinId,
    gender,
    character,
    headSrc: characterAvatarPath(selectedSkinId, gender),
    bodySrc: characterFullPath(selectedSkinId, gender),
    backgroundSrc: backgroundImagePath(profile?.backgroundKey),
    initial: characterInitial(selectedSkinId, gender),
  };
}
