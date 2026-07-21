"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import GradientLabel from "@/components/onboarding/gradient-label";
import GoldCoin from "@/components/ui/gold-coin";
import PageBackground from "@/components/ui/page-background";
import { usePlayerProfile } from "@/hooks/use-player-profile";
import { useProfileShellData } from "@/hooks/use-profile-shell";
import { PROFILE_BACKGROUNDS, STORE_BACKGROUNDS } from "@/lib/backgrounds";
import { OG_CHARACTERS } from "@/lib/characters";
import { spendCoins, writeCoinsBalance } from "@/lib/coins";
import {
  equipInventoryItem,
  fetchMyInventory,
  InventoryApiError,
  messageForInventoryError,
  purchaseInventoryItem,
  type InventoryView,
} from "@/lib/inventory-api";
import { fetchMyProfile, writeCachedProfile } from "@/lib/profile-api";
import { clearSession, loadSession } from "@/lib/session";
import { cn } from "@/lib/utils";

type StoreKind = "character" | "background";
type SelectedSource = "store" | "user";

type Offer = {
  id: string;
  kind: StoreKind;
  refId: string;
  title: string;
  imageSrc: string;
  price: number;
  owned: boolean;
  equipped: boolean;
};

export default function StorePage() {
  const router = useRouter();
  const [session] = useState(() => (typeof window !== "undefined" ? loadSession() : null));
  const { profile } = usePlayerProfile(session);
  const shell = useProfileShellData(session, profile);
  const [inventory, setInventory] = useState<InventoryView | null>(null);
  const [selected, setSelected] = useState<{ item: Offer; source: SelectedSource } | null>(null);
  const [notify, setNotify] = useState<"buy" | "error" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    if (!session) {
      router.replace("/login");
      return;
    }
    try {
      const view = await fetchMyInventory(session);
      setInventory(view);
      setError("");
    } catch (error) {
      if (error instanceof InventoryApiError && error.isUnauthorized) {
        clearSession();
        router.replace("/login");
        return;
      }
      setError(messageForInventoryError(error));
    }
  }, [router, session]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const ownedKeys = useMemo(
    () => new Set(inventory?.items.map((i) => `${i.kind}:${i.refId}`) ?? []),
    [inventory],
  );

  const userOffers: Offer[] = useMemo(() => {
    const characters = OG_CHARACTERS.filter((c) => ownedKeys.has(`character:${c.id}`)).map((c) => ({
      id: `character:${c.id}`,
      kind: "character" as const,
      refId: c.id,
      title: c.name,
      imageSrc: c.fullSrc || c.thumbnailSrc || c.avatarSrc,
      price: 0,
      owned: true,
      equipped: inventory?.equippedCharacterId === c.id,
    }));
    const backgrounds = PROFILE_BACKGROUNDS.filter((b) => ownedKeys.has(`background:${b.id}`)).map(
      (b) => ({
        id: `background:${b.id}`,
        kind: "background" as const,
        refId: b.id,
        title: b.label,
        imageSrc: b.src,
        price: b.price ?? 0,
        owned: true,
        equipped: inventory?.equippedBackgroundKey === b.id,
      }),
    );
    return [...characters, ...backgrounds];
  }, [ownedKeys, inventory]);

  const storeOffers: Offer[] = useMemo(
    () =>
      STORE_BACKGROUNDS.filter((b) => !ownedKeys.has(`background:${b.id}`)).map((b) => ({
        id: `background:${b.id}`,
        kind: "background" as const,
        refId: b.id,
        title: b.label,
        imageSrc: b.src,
        price: b.price ?? 350,
        owned: false,
        equipped: false,
      })),
    [ownedKeys],
  );

  useEffect(() => {
    setSelected((prev) => {
      if (!prev) {
        const first = storeOffers[0] ?? userOffers[0];
        return first ? { item: first, source: first.owned ? "user" : "store" } : null;
      }
      const pool = prev.source === "store" ? storeOffers : userOffers;
      const fresh = pool.find((o) => o.id === prev.item.id);
      if (!fresh) {
        const fallback = storeOffers[0] ?? userOffers[0];
        return fallback ? { item: fallback, source: fallback.owned ? "user" : "store" } : null;
      }
      return { item: fresh, source: prev.source };
    });
  }, [inventory, storeOffers, userOffers]);

  async function onBuy() {
    if (!session || !selected || selected.source !== "store") return;
    setBusy(true);
    setNotify(null);
    setError("");

    const price = selected.item.price;
    const spent = spendCoins(price);
    if (!spent.ok) {
      setNotify("error");
      setBusy(false);
      return;
    }

    try {
      const view = await purchaseInventoryItem(session, selected.item.kind, selected.item.refId);
      setInventory(view);
      const nextProfile = await fetchMyProfile(session);
      if (nextProfile) writeCachedProfile(nextProfile);
      setNotify("buy");
      setSelected(null);
    } catch {
      writeCoinsBalance(spent.balance + price);
      setError("Не удалось купить предмет");
      setNotify("error");
    } finally {
      setBusy(false);
    }
  }

  async function onEquip() {
    if (!session || !selected || selected.source !== "user") return;
    setBusy(true);
    setError("");
    try {
      const view = await equipInventoryItem(session, selected.item.kind, selected.item.refId);
      setInventory(view);
      const nextProfile = await fetchMyProfile(session);
      if (nextProfile) writeCachedProfile(nextProfile);
    } catch {
      setError("Не удалось экипировать");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-full flex-1 flex-row items-start justify-center overflow-x-hidden px-3 py-3 md:gap-8 md:overflow-visible md:px-6 md:py-12 md:pt-16">
      <PageBackground src="/media/ui/store-background.webp" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-black/50 min-[2400px]:bg-black/85"
      />
      <div className="relative z-10 mx-auto flex w-max max-w-full flex-row items-start justify-center gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] md:gap-8 md:overflow-visible md:pb-0 [&::-webkit-scrollbar]:hidden">
        <div className="flex shrink-0 flex-col gap-3">
          <GradientLabel color="amber">
            <h5 className="inline-flex items-center gap-2 font-unbounded text-xs font-medium leading-3.5 text-primaryText md:text-[17px] md:leading-6">
              {shell.username}
              <span className="inline-flex items-center gap-1 text-mos-amber" title="Золотые монеты">
                <GoldCoin className="h-4 w-4" />
                {shell.balance.toLocaleString("ru-RU")}
              </span>
            </h5>
          </GradientLabel>
          <OfferGrid
            items={userOffers}
            selectedId={selected?.source === "user" ? selected.item.id : null}
            onSelect={(item) => {
              setNotify(null);
              setSelected({ item, source: "user" });
            }}
          />
        </div>

        {!notify ? (
          <SelectedPanel
            item={selected?.item ?? null}
            source={selected?.source ?? null}
            busy={busy}
            error={error}
            onBuy={() => void onBuy()}
            onEquip={() => void onEquip()}
            onInventory={() => router.push("/inventory")}
          />
        ) : (
          <Notification
            notify={notify}
            onClick={() => {
              setNotify(null);
            }}
          />
        )}

        <div className="flex shrink-0 flex-col gap-3">
          <GradientLabel color="orange">
            <h5 className="font-display text-xs font-medium text-[#ee4810] md:text-[17px]">
              Лавка мастера Хаттори
            </h5>
          </GradientLabel>
          <OfferGrid
            items={storeOffers}
            selectedId={selected?.source === "store" ? selected.item.id : null}
            showPrice
            onSelect={(item) => {
              setNotify(null);
              setSelected({ item, source: "store" });
            }}
          />
        </div>
      </div>
    </div>
  );
}

const STORE_MOBILE_COLUMNS = 3;
const STORE_DESKTOP_COLUMNS = 4;
const STORE_MIN_ROWS_MOBILE = 2;
const STORE_MIN_ROWS_DESKTOP = 3;
const STORE_MIN_ROWS_WIDE = 5;

function useStoreGridLayout() {
  const [layout, setLayout] = useState({
    columns: STORE_DESKTOP_COLUMNS,
    minRows: STORE_MIN_ROWS_DESKTOP,
  });

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 767px)");
    const wide = window.matchMedia("(min-width: 2400px)");
    const sync = () => {
      const isMobile = mobile.matches;
      setLayout({
        columns: isMobile ? STORE_MOBILE_COLUMNS : STORE_DESKTOP_COLUMNS,
        minRows: isMobile
          ? STORE_MIN_ROWS_MOBILE
          : wide.matches
            ? STORE_MIN_ROWS_WIDE
            : STORE_MIN_ROWS_DESKTOP,
      });
    };
    sync();
    mobile.addEventListener("change", sync);
    wide.addEventListener("change", sync);
    return () => {
      mobile.removeEventListener("change", sync);
      wide.removeEventListener("change", sync);
    };
  }, []);

  return layout;
}

function OfferGrid({
  items,
  selectedId,
  onSelect,
  showPrice,
}: {
  items: Offer[];
  selectedId: string | null;
  onSelect: (item: Offer) => void;
  showPrice?: boolean;
}) {
  const { columns, minRows } = useStoreGridLayout();
  const totalRows = Math.max(minRows, Math.ceil(items.length / columns));
  const totalSlots = totalRows * columns;
  const cells: Array<Offer | null> = [...items];
  while (cells.length < totalSlots) cells.push(null);

  const rows = Array.from({ length: totalRows }, (_, rowIndex) =>
    cells.slice(rowIndex * columns, rowIndex * columns + columns),
  );

  return (
    <div className="mobile-game-scroll og-inventory-grid-shell min-[2400px]:max-h-[760px]">
      <div className="og-inventory-list">
        {rows.map((row, rowIndex) => (
          <div key={`row-${rowIndex}`} className="og-inventory-row">
            {row.map((item, index) => {
              const slotIndex = rowIndex * columns + index;
              if (!item) {
                return (
                  <div
                    key={`empty-${slotIndex}`}
                    className="og-inventory-slot bg-mos-stone/30"
                    aria-hidden
                  />
                );
              }
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect(item)}
                  className={cn(
                    "og-inventory-slot",
                    item.equipped && "og-inventory-slot--equipped",
                    selectedId === item.id && "og-inventory-slot--selected",
                  )}
                >
                  <span className="og-inventory-slot-inner relative">
                    <Image
                      src={item.imageSrc}
                      alt={item.title}
                      fill
                      sizes="(max-width: 767px) 72px, 112px"
                      className="object-contain"
                      loading="lazy"
                    />
                  </span>
                  {showPrice ? (
                    <span className="absolute bottom-1 left-1/2 z-[3] flex -translate-x-1/2 items-center gap-0.5 rounded bg-black/55 px-1.5 py-0.5 font-display text-[10px] leading-none text-mos-text md:text-[13.5px]">
                      {item.price}
                      <GoldCoin className="h-[15px] w-[15px]" />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function SelectedPanel({
  item,
  source,
  busy,
  error,
  onBuy,
  onEquip,
  onInventory,
}: {
  item: Offer | null;
  source: SelectedSource | null;
  busy: boolean;
  error: string;
  onBuy: () => void;
  onEquip: () => void;
  onInventory: () => void;
}) {
  if (!item) return <div className="w-[192px] shrink-0 md:w-[280px]" />;

  return (
    <div className="flex w-[192px] shrink-0 flex-col items-center justify-center rounded-[24px] pt-6 md:w-[280px] md:py-16">
      <p className="w-full text-center font-display text-xs font-medium text-mos-text md:text-[17px]">
        {item.title}
      </p>
      <div className="relative mt-2 h-[180px] w-full overflow-hidden rounded-2xl drop-shadow-[0_12px_28px_rgba(212,168,75,0.25)] md:mt-4 md:h-[320px] md:rounded-[24px] xl:h-[380px]">
        <Image
          src={item.imageSrc}
          alt={item.title}
          fill
          sizes="(max-width: 767px) 192px, 280px"
          className="object-cover object-center"
          priority
        />
      </div>
      {error ? <p className="mt-2 text-center text-xs text-mos-danger">{error}</p> : null}
      {source === "store" ? (
        <button
          type="button"
          disabled={busy}
          onClick={onBuy}
          className="og-btn og-btn-secondary og-btn-md mt-3 flex w-[calc(100%-4px)] items-center justify-center gap-2"
        >
          Купить за {item.price}
          <GoldCoin className="h-4 w-4" />
        </button>
      ) : (
        <div className="mt-3 flex w-full flex-col gap-2">
          <button
            type="button"
            disabled={busy || item.equipped}
            onClick={onEquip}
            className="og-btn og-btn-primary og-btn-md w-full disabled:opacity-50"
          >
            {item.equipped ? "Экипирован" : "Надеть"}
          </button>
          <button
            type="button"
            onClick={onInventory}
            className="og-btn og-btn-secondary og-btn-md w-full"
          >
            смотреть в инвентаре
          </button>
        </div>
      )}
    </div>
  );
}

function Notification({ notify, onClick }: { notify: "buy" | "error"; onClick: () => void }) {
  return (
    <div className="og-panel mt-10 inline-flex w-[192px] shrink-0 flex-col items-center gap-3 p-3 md:mt-48 md:w-[280px] md:gap-4 md:p-6">
      <h5 className="text-center font-display text-[15px] font-medium text-mos-text">
        {notify === "buy" ? "Залутано" : "Нужно больше монет"}
      </h5>
      <p className="text-center font-golos text-xs text-mos-muted md:text-sm">
        {notify === "buy"
          ? "Купленный предмет можно использовать в инвентаре"
          : "Проверьте баланс золотых монет в профиле"}
      </p>
      <button type="button" onClick={onClick} className="og-btn og-btn-primary og-btn-md w-full">
        {notify === "buy" ? "Отлично!" : "Понятно"}
      </button>
    </div>
  );
}
