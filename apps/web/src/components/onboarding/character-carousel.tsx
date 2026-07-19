"use client";

import { useEffect, useState } from "react";
import type { OgCharacter } from "@/lib/characters";
import { CENTER_CAROUSEL_INDEX } from "@/lib/characters";
import { cn } from "@/lib/utils";

type CharacterCarouselProps = {
  characters: OgCharacter[];
  characterPositions: Record<string, number>;
  onCharacterClick: (id: string) => void;
  centerCharacter?: OgCharacter | null;
  className?: string;
};

const POSITIONS = [
  { left: "calc(50% - 52vh)", scale: 0.85, opacity: 0.55, zIndex: 1 },
  { left: "calc(50% - 28vh)", scale: 0.9, opacity: 0.65, zIndex: 2 },
  { left: "50%", scale: 1.05, opacity: 1, zIndex: 3 },
  { left: "calc(50% + 28vh)", scale: 0.9, opacity: 0.65, zIndex: 2 },
  { left: "calc(50% + 52vh)", scale: 0.85, opacity: 0.55, zIndex: 1 },
] as const;

export function CharacterInfo({ character }: { character: OgCharacter }) {
  return (
    <div className="mx-auto w-full max-w-xl rounded-3xl border border-mos-line/40 bg-mos-bg/75 p-4 backdrop-blur md:max-w-2xl">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h3 className="font-display text-base text-mos-text md:text-lg">{character.name}</h3>
        {character.bonus && (
          <span className="inline-flex w-fit rounded-full border border-mos-amber/30 bg-mos-amber/10 px-3 py-1 text-xs text-mos-amber">
            {character.bonus}
          </span>
        )}
      </div>
      <p className="mt-2 text-sm leading-5 text-mos-muted">{character.description}</p>
    </div>
  );
}

function CarouselItem({
  character,
  positionIndex,
  onCharacterClick,
}: {
  character: OgCharacter;
  positionIndex: number;
  onCharacterClick: (id: string) => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const position = POSITIONS[positionIndex] ?? POSITIONS[CENTER_CAROUSEL_INDEX];

  useEffect(() => {
    setLoaded(false);
    const img = new Image();
    img.onload = () => setLoaded(true);
    img.onerror = () => setLoaded(true);
    img.src = character.fullSrc;
  }, [character.fullSrc]);

  return (
    <button
      type="button"
      className={cn(
        "absolute bottom-0 -translate-x-1/2 transition-all duration-500",
        !loaded && "opacity-0",
      )}
      style={{
        left: position.left,
        transform: `translateX(-50%) scale(${position.scale})`,
        opacity: loaded ? position.opacity : 0,
        zIndex: position.zIndex,
        width: "min(48vh, 360px)",
        height: "min(65vh, 620px)",
      }}
      onClick={() => onCharacterClick(character.id)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={character.fullSrc}
        alt={character.name}
        className="h-full w-full object-contain object-bottom drop-shadow-[0_20px_40px_rgba(0,0,0,0.55)]"
        draggable={false}
      />
    </button>
  );
}

export default function CharacterCarousel({
  characters,
  characterPositions,
  onCharacterClick,
  centerCharacter,
  className,
}: CharacterCarouselProps) {
  return (
    <div className={cn("relative flex w-full flex-col gap-4", className)}>
      {centerCharacter && <CharacterInfo character={centerCharacter} />}
      <div className="relative mx-auto h-[min(65vh,620px)] w-full max-w-6xl overflow-hidden">
        {characters.map((character) => (
          <CarouselItem
            key={character.id}
            character={character}
            positionIndex={characterPositions[character.id] ?? CENTER_CAROUSEL_INDEX}
            onCharacterClick={onCharacterClick}
          />
        ))}
      </div>
    </div>
  );
}
