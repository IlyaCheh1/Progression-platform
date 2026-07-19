"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconInventoryAll,
  IconInventoryBackgrounds,
  IconInventoryCharacters,
  IconInventoryEquipment,
} from "@/components/inventory/inventory-filter-icons";
import TabSelector from "@/components/ui/tab-selector";
import {
  equipInventoryItem,
  fetchMyInventory,
  inventoryBackgrounds,
  inventoryCharacters,
  inventoryTitles,
  type InventoryBackgroundItem,
  type InventoryCharacterItem,
  type InventoryKind,
  type InventoryTitleItem,
  type InventoryView,
} from "@/lib/inventory-api";
import { fetchMyProfile, writeCachedProfile } from "@/lib/profile-api";
import { loadSession } from "@/lib/session";
import { cn, schoolApiUnavailableMessage } from "@/lib/utils";

type FilterId = "all" | "characters" | "equipment" | "backgrounds";

const FILTER_ITEMS = [
  {
    id: "all" as const,
    label: "Все предметы",
    icon: <IconInventoryAll className="h-full w-full" />,
  },
  {
    id: "characters" as const,
    label: "Персонажи",
    icon: <IconInventoryCharacters className="h-full w-full" />,
  },
  {
    id: "equipment" as const,
    label: "Снаряжение",
    icon: <IconInventoryEquipment className="h-full w-full" />,
  },
  {
    id: "backgrounds" as const,
    label: "Фоны",
    icon: <IconInventoryBackgrounds className="h-full w-full" />,
  },
];

const MOBILE_COLUMNS = 4;
const DESKTOP_COLUMNS = 5;
const MIN_ROWS = 4;

type SlotItem =
  | {
      kind: "character";
      key: string;
      title: string;
      imageSrc: string;
      equipped: boolean;
      refId: string;
    }
  | {
      kind: "background";
      key: string;
      title: string;
      imageSrc: string;
      equipped: boolean;
      refId: string;
    }
  | {
      kind: "title";
      key: string;
      title: string;
      imageSrc?: undefined;
      equipped: boolean;
      refId: string;
    };

function useInventoryColumns() {
  const [columns, setColumns] = useState(DESKTOP_COLUMNS);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const sync = () => setColumns(media.matches ? DESKTOP_COLUMNS : MOBILE_COLUMNS);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return columns;
}

export default function InventoryPage() {
  const router = useRouter();
  const columns = useInventoryColumns();
  const [inventory, setInventory] = useState<InventoryView | null>(null);
  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");

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
    const equipment = inventoryTitles(inventory).map(
      (item: InventoryTitleItem): SlotItem => ({
        kind: "title",
        key: item.holding.key,
        title: item.name,
        equipped: item.equipped,
        refId: item.titleKey,
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
    if (filter === "equipment") return equipment;
    if (filter === "backgrounds") return backgrounds;
    return [...characters, ...equipment, ...backgrounds];
  }, [inventory, filter]);

  async function equip(kind: InventoryKind, refId: string) {
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

  const totalRows = Math.max(MIN_ROWS, Math.ceil(slots.length / columns));
  const totalSlots = totalRows * columns;
  const padded: Array<SlotItem | null> = [...slots];
  while (padded.length < totalSlots) {
    padded.push(null);
  }

  const rows = Array.from({ length: totalRows }, (_, rowIndex) =>
    padded.slice(rowIndex * columns, rowIndex * columns + columns),
  );

  return (
    <main className="mx-auto mb-20 mt-3 max-w-[840px] px-3 md:mt-11 md:px-4">
      <div className="flex flex-col items-center gap-3">
        <TabSelector
          items={FILTER_ITEMS}
          activeId={filter}
          onChange={(id) => setFilter(id as FilterId)}
        />

        {error ? <p className="text-center text-sm text-mos-danger">{error}</p> : null}

        <div className="mobile-game-scroll og-inventory-grid-shell max-h-[calc(100lvh-140px)] pr-1">
          <div className="og-inventory-list">
            {rows.map((row, rowIndex) => (
              <div key={`row-${rowIndex}`} className="og-inventory-row">
                {row.map((item, index) => {
                  const slotIndex = rowIndex * columns + index;
                  if (!item) {
                    return (
                      <div
                        key={`empty-${slotIndex}`}
                        className="og-inventory-slot bg-secondaryBg/60"
                        aria-hidden
                      />
                    );
                  }
                  const busy = busyKey === `${item.kind}:${item.refId}`;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      disabled={item.equipped || busy}
                      title={item.equipped ? "Экипирован" : `Надеть: ${item.title}`}
                      onClick={() => void equip(item.kind, item.refId)}
                      className={cn(
                        "og-inventory-slot",
                        item.equipped && "og-inventory-slot--equipped",
                        (item.equipped || busy) && "cursor-default",
                      )}
                    >
                      <span className="og-inventory-slot-inner">
                        {item.kind === "title" ? (
                          <span className="flex h-full w-full flex-col items-center justify-center gap-1 bg-mos-stone px-1 text-center">
                            <IconInventoryEquipment className="h-5 w-5 text-mos-amber md:h-7 md:w-7" />
                            <span className="line-clamp-2 font-display text-[8px] font-medium leading-tight text-mos-text md:text-[10px]">
                              {item.title}
                            </span>
                          </span>
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.imageSrc} alt={item.title} />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
