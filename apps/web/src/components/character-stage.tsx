"use client";

import CharacterAvatar from "@/components/character-avatar";
import type { GenderId } from "@/lib/avatars";
import type { OgCharacterId } from "@/lib/characters";
import { cn } from "@/lib/utils";

type CharacterStageProps = {
  username: string;
  selectedSkinId: OgCharacterId;
  gender: GenderId;
  backgroundSrc: string;
  className?: string;
};

export default function CharacterStage({
  username,
  selectedSkinId,
  gender,
  backgroundSrc,
  className,
}: CharacterStageProps) {
  return (
    <section
      className={cn(
        "relative flex min-h-[calc(100vh-60px)] flex-1 items-end justify-center overflow-hidden bg-cover bg-center",
        className,
      )}
      style={{ backgroundImage: `url(${backgroundSrc})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/40" />

      <div className="relative z-10 flex w-full max-w-6xl flex-col items-center px-4 pb-6 pt-24">
        <div className="mb-4 rounded-full border border-mos-amber/30 bg-gradient-to-r from-mos-amber/20 via-purple-500/10 to-mos-amber/20 px-6 py-2 shadow-[0_0_24px_rgba(201,162,39,0.15)]">
          <p className="font-display text-center text-lg text-mos-text md:text-2xl">{username}</p>
        </div>

        <div className="relative flex h-[min(65vh,620px)] w-full max-w-md items-end justify-center">
          <CharacterAvatar
            selectedSkinId={selectedSkinId}
            gender={gender}
            variant="full"
            className="h-full w-auto max-w-[min(75vw,360px)]"
            imageClassName="h-full w-auto max-h-full object-contain object-bottom drop-shadow-[0_20px_40px_rgba(0,0,0,0.55)]"
          />
          <div className="pointer-events-none absolute inset-x-8 bottom-0 h-24 rounded-full bg-black/40 blur-2xl" />
        </div>
      </div>
    </section>
  );
}
