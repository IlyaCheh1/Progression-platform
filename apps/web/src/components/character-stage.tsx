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
        "relative flex min-h-[calc(100vh-72px)] flex-1 flex-col overflow-hidden bg-cover bg-center md:min-h-[calc(100vh-72px)]",
        className,
      )}
      style={{ backgroundImage: `url(${backgroundSrc})` }}
    >
      {children}

      <div
        className="character-stage-stack relative z-10 flex min-h-0 w-full flex-1 select-none flex-col"
        onDragStart={(event) => event.preventDefault()}
      >
        <div className="character-stage-gap flex-1" aria-hidden />

        <GradientLabel color="amber" className="relative z-20 mx-auto mb-5 max-w-[200px] shrink-0">
          <p className="text-center font-unbounded text-xs font-medium leading-3 text-primaryText md:text-lg md:leading-6">
            {username}
          </p>
        </GradientLabel>

        <div className="character-stage-gap flex-1" aria-hidden />

        <div className="character-stage-figure relative flex shrink-0 items-end justify-center">
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
