"use client";

import type { CSSProperties } from "react";
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
  /**
   * Uploaded profile avatar. For head variant, character art is never used as a stand-in —
   * only a custom image or letter fallback is shown.
   */
  imageSrc?: string | null;
  /** When true (default for head), never fall back to character portrait. */
  preferUploadedAvatar?: boolean;
  fallbackLetter?: string;
  className?: string;
  imageClassName?: string;
  style?: CSSProperties;
};

export default function CharacterAvatar({
  selectedSkinId,
  gender,
  variant = "head",
  imageSrc,
  preferUploadedAvatar = variant === "head",
  fallbackLetter,
  className,
  imageClassName,
  style,
}: CharacterAvatarProps) {
  const customSrc = imageSrc?.trim() ? imageSrc.trim() : "";
  const useLetterOnly = variant === "head" && preferUploadedAvatar && !customSrc;
  const src =
    customSrc ||
    (useLetterOnly
      ? ""
      : variant === "full"
        ? characterFullPath(selectedSkinId, gender)
        : characterAvatarPath(selectedSkinId, gender));
  const character = getCharacterById(normalizeSelectedSkinId(selectedSkinId, gender));
  const alt = customSrc ? "Аватар" : (character?.name ?? "Персонаж");
  const letter = (fallbackLetter?.trim() || characterInitial(selectedSkinId, gender)).slice(0, 1).toUpperCase();

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        variant === "head" ? "rounded-2xl" : "rounded-none",
        className,
      )}
      style={style}
    >
      {src ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className={cn(
              "h-full w-full",
              customSrc ? "object-cover object-center" : "object-contain",
              imageClassName,
            )}
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
            {letter}
          </div>
        </>
      ) : (
        <div
          className="grid h-full w-full place-items-center bg-mos-stone/70 font-display text-2xl text-mos-amber"
          aria-label="Аватар"
        >
          {letter}
        </div>
      )}
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
