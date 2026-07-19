"use client";

import { useEffect, useState } from "react";
import type { OgCharacter } from "@/lib/characters";
import { CENTER_CAROUSEL_INDEX } from "@/lib/characters";
import { cn } from "@/lib/utils";

type CharacterCarouselProps = {
  characters: OgCharacter[];
  characterPositions: Record<string, number>;
  onCharacterClick: (id: string) => void;
  getCenterCharacterId: () => string;
  className?: string;
};

type SlotStyle = {
  left: string;
  scale: number;
  opacity: number;
  zIndex: number;
  bottom: string;
};

function useCompactCarousel() {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1279px)");
    const sync = () => setCompact(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return compact;
}

function slotStyles(compact: boolean): Record<number, SlotStyle> {
  return {
    0: {
      left: compact ? "calc(50% - 64vh)" : "calc(50% - 52vh)",
      scale: 0.85,
      opacity: 0.6,
      zIndex: 1,
      bottom: "-40px",
    },
    1: {
      left: compact ? "calc(50% - 34vh)" : "calc(50% - 28vh)",
      scale: 0.9,
      opacity: 0.6,
      zIndex: 2,
      bottom: "-40px",
    },
    2: {
      left: "50%",
      scale: 1.1,
      opacity: 1,
      zIndex: 3,
      bottom: "-40px",
    },
    3: {
      left: compact ? "calc(50% + 34vh)" : "calc(50% + 28vh)",
      scale: 0.9,
      opacity: 0.6,
      zIndex: 2,
      bottom: "-40px",
    },
    4: {
      left: compact ? "calc(50% + 64vh)" : "calc(50% + 52vh)",
      scale: 0.85,
      opacity: 0.6,
      zIndex: 1,
      bottom: "-40px",
    },
  };
}

export function CharacterInfo({ character }: { character: OgCharacter }) {
  const bonusParts = character.bonus?.trim().split(/\s+/) ?? [];
  const bonusValue = bonusParts[0];
  const bonusLabel = bonusParts.slice(1).join(" ");

  return (
    <div
      className={cn(
        "bg-gradient-light-profile absolute bottom-3 right-4 z-20 h-fit w-full max-w-[254px] rounded-3xl p-2 backdrop-blur-md transition-all duration-300",
        "max-xl:w-fit xl:relative xl:top-3 xl:left-1/2 xl:max-w-[450px] xl:-translate-x-1/2 xl:px-6 xl:py-4",
      )}
    >
      <div className="flex flex-col-reverse gap-2 xl:flex-row xl:items-center">
        <h3 className="font-unbounded text-[12px] font-medium leading-6 text-mos-text xl:text-[17px]">
          {character.name}
        </h3>
        {bonusValue && (
          <div className="inline-flex w-fit items-center justify-center gap-1 rounded-[10px] bg-black/50 px-2 py-1 backdrop-blur-xl">
            <span className="bg-gradient-premium bg-clip-text text-xs text-transparent">{bonusValue}</span>
            {bonusLabel ? <span className="text-xs text-mos-text">{bonusLabel}</span> : null}
          </div>
        )}
      </div>
      <p className="mt-2 text-xs leading-5 text-mos-text xl:text-sm">{character.description}</p>
    </div>
  );
}

function CarouselItem({
  character,
  positionIndex,
  onCharacterClick,
  compact,
}: {
  character: OgCharacter;
  positionIndex: number;
  onCharacterClick: (id: string) => void;
  compact: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const positions = slotStyles(compact);
  const position = positions[positionIndex] ?? positions[CENTER_CAROUSEL_INDEX];

  useEffect(() => {
    setLoaded(false);
    const minimumLoadTime = 800;
    let cancelled = false;

    const imageReady = new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = character.fullSrc;
    });

    void Promise.all([imageReady, new Promise<void>((resolve) => setTimeout(resolve, minimumLoadTime))]).then(() => {
      if (!cancelled) setLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, [character.fullSrc]);

  return (
    <div
      className="absolute transition-all duration-500 max-xl:!scale-100"
      style={{
        left: position.left,
        transform: `translateX(-50%) scale(${position.scale})`,
        opacity: position.opacity,
        zIndex: position.zIndex,
        bottom: position.bottom,
        height: "inherit",
        width: "calc(24vh * 2)",
      }}
      onClick={() => onCharacterClick(character.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onCharacterClick(character.id);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={character.name}
    >
      <div className="relative h-full w-full overflow-hidden">
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-mos-amber/30 border-t-mos-amber" />
          </div>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={character.fullSrc}
          alt={character.name}
          draggable={false}
          className={cn(
            "h-full w-full object-contain transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0",
          )}
        />
      </div>
    </div>
  );
}

export default function CharacterCarousel({
  characters,
  characterPositions,
  onCharacterClick,
  getCenterCharacterId,
  className,
}: CharacterCarouselProps) {
  const compact = useCompactCarousel();
  const centerCharacter = characters.find((item) => item.id === getCenterCharacterId());

  return (
    <>
      {centerCharacter ? <CharacterInfo character={centerCharacter} /> : null}

      <div
        className={cn(
          "relative flex h-auto w-full flex-1 flex-col items-center justify-start",
          className,
        )}
      >
        <div
          className="relative flex h-full w-full flex-1 select-none"
          onDragStart={(event) => event.preventDefault()}
        >
          {characters.map((character) => (
            <CarouselItem
              key={character.id}
              character={character}
              positionIndex={characterPositions[character.id] ?? CENTER_CAROUSEL_INDEX}
              onCharacterClick={onCharacterClick}
              compact={compact}
            />
          ))}
        </div>
      </div>
    </>
  );
}
