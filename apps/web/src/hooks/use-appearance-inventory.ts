"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  equipInventoryItem,
  fetchMyInventory,
  InventoryApiError,
  inventoryBackgrounds,
  inventoryCharacters,
  messageForInventoryError,
  type InventoryBackgroundItem,
  type InventoryCharacterItem,
  type InventoryView,
} from "@/lib/inventory-api";
import { fetchMyProfile, writeCachedProfile, type PlayerProfile } from "@/lib/profile-api";
import { clearSession, type SessionUser } from "@/lib/session";

type UseAppearanceInventoryOptions = {
  onProfileUpdated?: (profile: PlayerProfile) => void;
};

export function useAppearanceInventory(
  session: SessionUser | null,
  options: UseAppearanceInventoryOptions = {},
) {
  const { onProfileUpdated } = options;
  const [inventory, setInventory] = useState<InventoryView | null>(null);
  const [loading, setLoading] = useState(Boolean(session));
  const [equippingId, setEquippingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    if (!session) {
      setInventory(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const view = await fetchMyInventory(session);
      setInventory(view);
    } catch (error) {
      if (error instanceof InventoryApiError && error.isUnauthorized) {
        clearSession();
        setInventory(null);
        setError("Сессия истекла. Войдите снова.");
        return;
      }
      setError(messageForInventoryError(error));
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const characters = useMemo(
    () => (inventory ? inventoryCharacters(inventory) : []),
    [inventory],
  );
  const backgrounds = useMemo(
    () => (inventory ? inventoryBackgrounds(inventory) : []),
    [inventory],
  );

  const equip = useCallback(
    async (kind: "character" | "background", refId: string) => {
      if (!session) return false;
      setEquippingId(`${kind}:${refId}`);
      setError("");
      try {
        const view = await equipInventoryItem(session, kind, refId);
        setInventory(view);
        const profile = await fetchMyProfile(session);
        if (profile) {
          writeCachedProfile(profile);
          onProfileUpdated?.(profile);
        }
        return true;
      } catch {
        setError("Не удалось применить предмет");
        return false;
      } finally {
        setEquippingId(null);
      }
    },
    [onProfileUpdated, session],
  );

  return {
    inventory,
    characters,
    backgrounds,
    loading,
    equippingId,
    error,
    reload,
    equipCharacter: (refId: string) => equip("character", refId),
    equipBackground: (refId: string) => equip("background", refId),
  };
}

export type { InventoryCharacterItem, InventoryBackgroundItem };
