"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import GradientLabel from "@/components/onboarding/gradient-label";
import PageBackground from "@/components/ui/page-background";
import type { GenderId } from "@/lib/avatars";
import { stageLayoutForBackground } from "@/lib/backgrounds";
import { characterDisplayScale, characterFullPath, type OgCharacterId } from "@/lib/characters";
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
  const characterSrc = characterFullPath(selectedSkinId, gender);

  return (
    <section
      className={cn(
        "relative flex h-full min-h-0 flex-1 flex-col overflow-hidden",
        className,
      )}
    >
      <PageBackground
        src={backgroundSrc}
        objectPosition={layout.backgroundPosition}
        imageClassName="object-center"
      />
      {children}

      <div
        className="absolute bottom-0 left-1/2 z-10 flex -translate-x-1/2 flex-col select-none"
        onDragStart={(event) => event.preventDefault()}
      >
        <GradientLabel color="amber" className="mx-auto mb-5 max-w-[200px]">
          <p className="text-center font-unbounded text-xs font-medium leading-3 text-primaryText xl:text-lg xl:leading-6">
            {username}
          </p>
        </GradientLabel>

        <div
          className={cn(
            "relative mx-auto flex w-auto items-end justify-center",
            layout.figureClassName,
          )}
          style={displayScale === 1 ? undefined : { transform: `scale(${displayScale})`, transformOrigin: "bottom center" }}
        >
          <Image
            src={characterSrc}
            alt="Персонаж"
            width={480}
            height={720}
            priority
            draggable={false}
            sizes="(max-width: 1279px) 70vw, 40vw"
            className={cn(
              "relative h-auto w-auto max-h-[65vh] min-h-[65vh] object-contain object-bottom xl:max-h-[75vh] xl:min-h-[75vh] xl:max-w-[75vh]",
            )}
          />
        </div>
      </div>
    </section>
  );
}
