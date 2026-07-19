"use client";

import type { ReactNode } from "react";
import CharacterAvatar from "@/components/character-avatar";
import GradientLabel from "@/components/onboarding/gradient-label";
import type { GenderId } from "@/lib/avatars";
import type { OgCharacterId } from "@/lib/characters";
import { cn } from "@/lib/utils";

type CharacterStageProps = {
  username: string;
  selectedSkinId: OgCharacterId;
  gender: GenderId;
  backgroundSrc: string;
  className?: string;
  children?: ReactNode;
};

export default function CharacterStage({
  username,
  selectedSkinId,
  gender,
  backgroundSrc,
  className,
  children,
}: CharacterStageProps) {
  return (
    <section
      className={cn(
        "relative flex min-h-[calc(100vh-72px)] flex-1 items-end justify-center overflow-hidden bg-cover bg-center md:min-h-[calc(100vh-72px)]",
        className,
      )}
      style={{ backgroundImage: `url(${backgroundSrc})` }}
    >
      {children}

      <div
        className="absolute bottom-0 left-1/2 z-10 flex -translate-x-1/2 flex-col select-none"
        onDragStart={(event) => event.preventDefault()}
      >
        <GradientLabel color="amber" className="relative z-20 mx-auto mb-8 max-w-[200px] md:mb-10">
          <p className="text-center font-display text-xs font-medium leading-3 text-mos-text md:text-lg md:leading-6">
            {username}
          </p>
        </GradientLabel>

        <div className="character-stage-figure relative flex items-end justify-center">
          <CharacterAvatar
            selectedSkinId={selectedSkinId}
            gender={gender}
            variant="full"
            className="relative h-full w-auto"
            imageClassName="h-full w-auto max-h-full object-contain object-bottom"
          />
        </div>
      </div>
    </section>
  );
}
