"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CENTER_CAROUSEL_INDEX,
  charactersForGender,
  type OgCharacter,
  type OgCharacterId,
} from "@/lib/characters";
import type { GenderId } from "@/lib/avatars";

function createInitialPositions(characters: OgCharacter[]) {
  const positions: Record<string, number> = {};
  if (characters.length === 1) {
    positions[characters[0].id] = CENTER_CAROUSEL_INDEX;
    return positions;
  }
  characters.forEach((character, index) => {
    positions[character.id] = index;
  });
  return positions;
}

export function useOnboardingCharacters(initialGender: GenderId = "MALE") {
  const [selectedGender, setSelectedGender] = useState<GenderId>(initialGender);
  const filteredCharacters = useMemo(() => charactersForGender(selectedGender), [selectedGender]);
  const [characterPositions, setCharacterPositions] = useState<Record<string, number>>(() =>
    createInitialPositions(charactersForGender(initialGender)),
  );

  useEffect(() => {
    setCharacterPositions(createInitialPositions(filteredCharacters));
  }, [filteredCharacters]);

  const getCenterCharacterId = useCallback((): OgCharacterId => {
    const center =
      Object.keys(characterPositions).find((id) => characterPositions[id] === CENTER_CAROUSEL_INDEX) ??
      filteredCharacters[CENTER_CAROUSEL_INDEX]?.id ??
      filteredCharacters[0]?.id ??
      "3";
    return center as OgCharacterId;
  }, [characterPositions, filteredCharacters]);

  const handleCharacterClick = useCallback(
    (characterId: string) => {
      const centerCharId = getCenterCharacterId();
      const clickedPosition = characterPositions[characterId];
      if (clickedPosition === undefined || characterId === centerCharId) return;
      setCharacterPositions((prev) => ({
        ...prev,
        [characterId]: CENTER_CAROUSEL_INDEX,
        [centerCharId]: clickedPosition,
      }));
    },
    [characterPositions, getCenterCharacterId],
  );

  const centerCharacter = useMemo(
    () => filteredCharacters.find((item) => item.id === getCenterCharacterId()) ?? filteredCharacters[CENTER_CAROUSEL_INDEX],
    [filteredCharacters, getCenterCharacterId],
  );

  return {
    selectedGender,
    setSelectedGender,
    filteredCharacters,
    characterPositions,
    getCenterCharacterId,
    handleCharacterClick,
    centerCharacter,
  };
}
