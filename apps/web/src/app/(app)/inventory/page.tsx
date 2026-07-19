"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Selector from "@/components/ui/selector";
import {
  equipInventoryItem,
  fetchMyInventory,
  inventoryBackgrounds,
  inventoryCharacters,
  type InventoryBackgroundItem,
  type InventoryCharacterItem,
  type InventoryView,
} from "@/lib/inventory-api";
import { fetchMyProfile, writeCachedProfile } from "@/lib/profile-api";
import { loadSession } from "@/lib/session";
import { cn, schoolApiUnavailableMessage } from "@/lib/utils";

type FilterId = "all" | "characters" | "backgrounds";

const FILTERS = [
  { id: "all" as const, label: "Все предметы" },
  { id: "characters" as const, label: "Персонажи" },
  { id: "backgrounds" as const, label: "Фоны" },
];

type SlotItem =
  | { kind: "character"; key: string; title: string; imageSrc: string; equipped: boolean; refId: string }
  | { kind: "background"; key: string; title: string; imageSrc: string; equipped: boolean; refId: string };

export default function InventoryPage() {
  const router = useRouter();
  const [inventory, setInventory] = useState<InventoryView | null>(null);
  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

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

  const slots: SlotItem[] = useMemo(() => {
    if (!inventory) return [];
    const characters = inventoryCharacters(inventory).map(
      (item: InventoryCharacterItem): SlotItem => ({
        kind: "character",
        key: item.holding.key,
        title: item.name,
        imageSrc: item.imageSrc,
        equipped: item.equipped,
        refId: item.characterId,
      }),
    );
    const backgrounds = inventoryBackgrounds(inventory).map(
      (item: InventoryBackgroundItem): SlotItem => ({
        kind: "background",
        key: item.holding.key,
        title: item.background.label,
        imageSrc: item.background.src,
        equipped: item.equipped,
        refId: item.background.id,
      }),
    );
    if (filter === "characters") return characters;
    if (filter === "backgrounds") return backgrounds;
    return [...characters, ...backgrounds];
  }, [inventory, filter]);

  useEffect(() => {
    if (!slots.length) {
      setSelectedKey(null);
      return;
    }
    if (!selectedKey || !slots.some((s) => s.key === selectedKey)) {
      setSelectedKey(slots.find((s) => s.equipped)?.key ?? slots[0].key);
    }
  }, [slots, selectedKey]);

  const selected = slots.find((s) => s.key === selectedKey) ?? null;

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

  const minSlots = 20;
  const padded: Array<SlotItem | null> = [...slots];
  while (padded.length < minSlots) {
    padded.push(null);
  }

  return (
    <main className="mx-auto max-w-[840px] px-3 pb-16 pt-3 md:mt-8 md:px-4">
      <div className="flex flex-col items-center gap-3 md:items-start md:justify-start md:gap-6 md:flex-row">
        <div className="flex w-full flex-col gap-3 md:w-auto">
          <Selector
            options={FILTERS}
            activeId={filter}
            onChange={(id) => setFilter(id as FilterId)}
            className="mx-auto w-fit md:mx-0"
          />

          <div className="mobile-game-scroll og-inventory-grid-shell max-h-[calc(100lvh-140px)] overflow-y-auto pr-1">
            <div className="grid grid-cols-4 gap-[5px] sm:grid-cols-5 md:grid-cols-5">
            {padded.map((item, index) => {
              if (!item) {
                return <div key={`empty-${index}`} className="og-inventory-slot bg-mos-stone/30" />;
              }
              const isSelected = item.key === selectedKey;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setSelectedKey(item.key)}
                  className={cn(
                    "og-inventory-slot",
                    item.equipped && "og-inventory-slot--equipped",
                    isSelected && "og-inventory-slot--selected",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageSrc}
                    alt={item.title}
                    className={cn(
                      "h-full w-full object-cover",
                      item.kind === "character" ? "object-top" : "object-center",
                    )}
                  />
                </button>
              );
            })}
            </div>
          </div>
        </div>

        <aside
          className={cn(
            "og-panel-soft w-full p-4 md:sticky md:top-24 md:w-[274px] md:p-6",
            !selected && "hidden md:block",
          )}
        >
          {selected ? (
            <div className="flex flex-col gap-4">
              <div className="overflow-hidden rounded-2xl bg-mos-bg/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selected.imageSrc}
                  alt={selected.title}
                  className={cn(
                    "mx-auto w-full",
                    selected.kind === "character" ? "aspect-[3/4] object-cover object-top" : "aspect-video object-cover",
                  )}
                />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-mos-muted">
                  {selected.kind === "character" ? "Персонаж" : "Фон профиля"}
                </p>
                <h2 className="mt-1 font-display text-lg text-mos-text">{selected.title}</h2>
              </div>
              {error ? <p className="text-sm text-mos-danger">{error}</p> : null}
              <button
                type="button"
                disabled={selected.equipped || busyKey === `${selected.kind}:${selected.refId}`}
                onClick={() => void equip(selected.kind, selected.refId)}
                className="og-btn og-btn-primary og-btn-md w-full disabled:opacity-60"
              >
                {selected.equipped
                  ? "Экипирован"
                  : busyKey === `${selected.kind}:${selected.refId}`
                    ? "…"
                    : "Надеть"}
              </button>
            </div>
          ) : (
            <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 text-center">
              <p className="font-display text-sm text-mos-text">Пусто</p>
              <p className="text-xs text-mos-muted">Завершите онбординг, чтобы получить стартовые предметы.</p>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
