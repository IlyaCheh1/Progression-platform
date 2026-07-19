"use client";

import type { ReactNode } from "react";
import CharacterAvatar from "@/components/character-avatar";
import GradientLabel from "@/components/onboarding/gradient-label";
import type { GenderId } from "@/lib/avatars";
import { stageLayoutForBackground } from "@/lib/backgrounds";
import { characterDisplayScale, type OgCharacterId } from "@/lib/characters";
import { cn } from "@/lib/utils";

type CharacterStageProps = {
  username: string;
  selectedSkinId: OgCharacterId;
  gender: GenderId;
  backgroundSrc: string;
  backgroundKey?: string | null;
  className?: string;
  children?: ReactNode;
};

export default function CharacterStage({
  username,
  selectedSkinId,
  gender,
  backgroundSrc,
  backgroundKey,
  className,
  children,
}: CharacterStageProps) {
  const layout = stageLayoutForBackground(backgroundKey);
  const displayScale = characterDisplayScale(selectedSkinId, gender);

  return (
    <section
      className={cn(
        "relative flex min-h-full flex-1 flex-col overflow-hidden bg-cover",
        className,
      )}
      style={{
        backgroundImage: `url(${backgroundSrc})`,
        backgroundPosition: layout.backgroundPosition,
      }}
    >
      {children}

      <div
        className="character-stage-stack relative z-10 flex min-h-0 w-full flex-1 select-none flex-col"
        onDragStart={(event) => event.preventDefault()}
      >
        {/* Ник привязан к отступу от верхнего меню — не зависит от высоты стоячего/сидячего персонажа */}
        <GradientLabel
          color="amber"
          className="character-stage-username relative z-20 mx-auto mt-8 max-w-[200px] shrink-0 md:mt-[72px]"
        >
          <p className="text-center font-unbounded text-xs font-medium leading-3 text-primaryText md:text-lg md:leading-6">
            {username}
          </p>
        </GradientLabel>

        <div className="character-stage-gap flex-1" aria-hidden />

        <div
          className={cn(
            "character-stage-figure relative mx-auto flex w-full shrink-0 items-end justify-center",
            layout.figureClassName,
          )}
        >
          <CharacterAvatar
            selectedSkinId={selectedSkinId}
            gender={gender}
            variant="full"
            className="relative mx-auto h-full w-auto max-w-full origin-bottom"
            imageClassName="mx-auto h-full w-auto max-h-full object-contain object-bottom origin-bottom"
            style={
              displayScale === 1
                ? undefined
                : { transform: `scale(${displayScale})` }
            }
          />
        </div>
      </div>
    </section>
  );
}
