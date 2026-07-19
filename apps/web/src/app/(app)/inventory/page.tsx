"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  equipInventoryItem,
  fetchMyInventory,
  inventoryBackgrounds,
  inventoryCharacters,
  type InventoryView,
} from "@/lib/inventory-api";
import { fetchMyProfile, writeCachedProfile } from "@/lib/profile-api";
import { loadSession } from "@/lib/session";
import { cn, schoolApiUnavailableMessage } from "@/lib/utils";

export default function InventoryPage() {
  const router = useRouter();
  const [inventory, setInventory] = useState<InventoryView | null>(null);
  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState("");

  const reload = useCallback(async () => {
    const session = loadSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    const view = await fetchMyInventory(session);
    if (!view) {
      setError(schoolApiUnavailableMessage());
      return;
    }
    setInventory(view);
    setError("");
  }, [router]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function equip(kind: "character" | "background", refId: string) {
    const session = loadSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    setBusyKey(`${kind}:${refId}`);
    setError("");
    try {
      const view = await equipInventoryItem(session, kind, refId);
      setInventory(view);
      const profile = await fetchMyProfile(session);
      if (profile) writeCachedProfile(profile);
    } catch {
      setError("Не удалось экипировать предмет");
    } finally {
      setBusyKey("");
    }
  }

  const characters = inventory ? inventoryCharacters(inventory) : [];
  const backgrounds = inventory ? inventoryBackgrounds(inventory) : [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-3xl text-mos-amber">Инвентарь</h1>
      <p className="mt-2 text-mos-muted">
        Персонажи и фоны из онбординга. Экипируйте другой предмет, чтобы заменить текущий облик.
      </p>

      {error ? <p className="mt-4 text-sm text-mos-danger">{error}</p> : null}

      <section className="mt-8">
        <h2 className="font-display text-xl text-mos-text">Персонажи</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
          {characters.map((item) => (
            <button
              key={item.holding.key}
              type="button"
              disabled={item.equipped || busyKey === `character:${item.characterId}`}
              onClick={() => void equip("character", item.characterId)}
              className={cn(
                "overflow-hidden border bg-mos-stone/40 text-left transition-colors",
                item.equipped ? "border-mos-amber" : "border-mos-line/40 hover:border-mos-amber/60",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.imageSrc} alt={item.name} className="aspect-[3/4] w-full object-cover object-top" />
              <div className="space-y-1 p-2">
                <p className="font-display text-xs text-mos-text">{item.name}</p>
                <p className="text-[10px] text-mos-muted">
                  {item.equipped ? "Экипирован" : busyKey === `character:${item.characterId}` ? "…" : "Надеть"}
                </p>
              </div>
            </button>
          ))}
          {characters.length === 0 ? (
            <p className="col-span-full text-sm text-mos-muted">Пока нет персонажей. Завершите онбординг.</p>
          ) : null}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl text-mos-text">Фоны профиля</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {backgrounds.map((item) => (
            <button
              key={item.holding.key}
              type="button"
              disabled={item.equipped || busyKey === `background:${item.background.id}`}
              onClick={() => void equip("background", item.background.id)}
              className={cn(
                "overflow-hidden border bg-mos-stone/40 text-left transition-colors",
                item.equipped ? "border-mos-amber" : "border-mos-line/40 hover:border-mos-amber/60",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.background.src} alt={item.background.label} className="h-24 w-full object-cover" />
              <div className="space-y-1 p-2">
                <p className="font-display text-xs text-mos-text">{item.background.label}</p>
                <p className="text-[10px] text-mos-muted">
                  {item.equipped
                    ? "Экипирован"
                    : busyKey === `background:${item.background.id}`
                      ? "…"
                      : "Надеть"}
                </p>
              </div>
            </button>
          ))}
          {backgrounds.length === 0 ? (
            <p className="col-span-full text-sm text-mos-muted">Пока нет фонов. Завершите онбординг.</p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
