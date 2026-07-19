"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import GradientLabel from "@/components/onboarding/gradient-label";
import { usePlayerProfile } from "@/hooks/use-player-profile";
import { useProfileShellData } from "@/hooks/use-profile-shell";
import { PROFILE_BACKGROUNDS } from "@/lib/backgrounds";
import { OG_CHARACTERS } from "@/lib/characters";
import {
  equipInventoryItem,
  fetchMyInventory,
  purchaseInventoryItem,
  type InventoryView,
} from "@/lib/inventory-api";
import { fetchMyProfile, writeCachedProfile } from "@/lib/profile-api";
import { loadSession } from "@/lib/session";
import { cn, schoolApiUnavailableMessage } from "@/lib/utils";

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
    const view = await fetchMyInventory(session);
    if (!view) {
      setError(schoolApiUnavailableMessage());
      return;
    }
    setInventory(view);
    setError("");
  }, [router, session]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const ownedKeys = useMemo(
    () => new Set(inventory?.items.map((i) => `${i.kind}:${i.refId}`) ?? []),
    [inventory],
  );

  const allOffers: Offer[] = useMemo(() => {
    const characters = OG_CHARACTERS.map((c) => ({
      id: `character:${c.id}`,
      kind: "character" as const,
      refId: c.id,
      title: c.name,
      imageSrc: c.fullSrc || c.thumbnailSrc || c.avatarSrc,
      price: 500,
      owned: ownedKeys.has(`character:${c.id}`),
      equipped: inventory?.equippedCharacterId === c.id,
    }));
    const backgrounds = PROFILE_BACKGROUNDS.filter((b) => b.id !== "onboarding_background").map((b) => ({
      id: `background:${b.id}`,
      kind: "background" as const,
      refId: b.id,
      title: b.label,
      imageSrc: b.src,
      price: b.unlock === "default" ? 150 : 350,
      owned: ownedKeys.has(`background:${b.id}`),
      equipped: inventory?.equippedBackgroundKey === b.id,
    }));
    return [...characters, ...backgrounds];
  }, [ownedKeys, inventory]);

  const userOffers = allOffers.filter((o) => o.owned);
  const storeOffers: Offer[] = [];

  useEffect(() => {
    setSelected((prev) => {
      if (!prev) {
        const first = storeOffers[0] ?? userOffers[0];
        return first ? { item: first, source: first.owned ? "user" : "store" } : null;
      }
      const fresh = allOffers.find((o) => o.id === prev.item.id);
      if (!fresh) return prev;
      return { item: fresh, source: fresh.owned ? "user" : "store" };
    });
    // Refresh selection when inventory ownership changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional inventory sync
  }, [inventory]);

  async function onBuy() {
    if (!session || !selected || selected.source !== "store") return;
    setBusy(true);
    setNotify(null);
    setError("");
    try {
      const view = await purchaseInventoryItem(session, selected.item.kind, selected.item.refId);
      setInventory(view);
      const nextProfile = await fetchMyProfile(session);
      if (nextProfile) writeCachedProfile(nextProfile);
      setNotify("buy");
      setSelected(null);
    } catch {
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
    <div className="relative flex min-h-[calc(100vh-72px)] flex-1 flex-row items-start justify-center gap-4 px-3 py-3 md:gap-8 md:px-6 md:py-12 md:pt-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url(/media/ui/store-background.webp)",
        }}
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-black/50" />
      <div className="relative z-10 flex w-full flex-row items-start justify-center gap-4 md:gap-8">
        <div className="flex flex-col gap-3">
          <GradientLabel color="amber">
            <h5 className="font-unbounded text-xs font-medium leading-3.5 text-primaryText md:text-[17px] md:leading-6">
              {shell.username}
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
              if (notify === "buy") setNotify(null);
              else setNotify(null);
            }}
          />
        )}

        <div className="flex flex-col gap-3">
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
  const cells: Array<Offer | null> = [...items];
  while (cells.length < 12) cells.push(null);

  return (
    <div className="og-inventory-grid-shell">
      <div className="grid grid-cols-3 gap-[5px] md:grid-cols-4">
        {cells.map((item, index) => {
          if (!item) {
            return <div key={`e-${index}`} className="og-inventory-slot bg-mos-stone/30" />;
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
              <span className="og-inventory-slot-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.imageSrc} alt={item.title} />
              </span>
              {showPrice ? (
                <span className="absolute bottom-1 left-1/2 z-[3] flex -translate-x-1/2 items-center gap-0.5 rounded bg-black/55 px-1 font-display text-[10px] text-mos-text">
                  {item.price}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/media/ui/coin.png" alt="" className="h-3 w-3" />
                </span>
              ) : null}
            </button>
          );
        })}
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
  if (!item) return <div className="w-[192px] md:w-[280px]" />;

  return (
    <div className="flex w-[192px] flex-col items-center justify-center rounded-[24px] pt-6 md:w-[280px] md:py-16">
      <p className="w-full text-center font-display text-xs font-medium text-mos-text md:text-[17px]">
        {item.title}
      </p>
      <div
        className="relative mt-2 h-[180px] w-full bg-cover bg-center drop-shadow-[0_12px_28px_rgba(212,168,75,0.25)] md:mt-4 md:h-[320px] xl:h-[380px]"
        style={{ backgroundImage: `url('${item.imageSrc}')` }}
      />
      {error ? <p className="mt-2 text-center text-xs text-mos-danger">{error}</p> : null}
      {source === "store" ? (
        <button
          type="button"
          disabled={busy}
          onClick={onBuy}
          className="og-btn og-btn-secondary og-btn-md mt-3 flex w-[calc(100%-4px)] items-center justify-center gap-2"
        >
          Купить за {item.price}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/media/ui/coin.png" alt="" className="h-6 w-6" />
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
    <div className="og-panel mt-10 inline-flex w-[192px] flex-col items-center gap-3 p-3 md:mt-48 md:w-[280px] md:gap-4 md:p-6">
      <h5 className="text-center font-display text-[15px] font-medium text-mos-text">
        {notify === "buy" ? "Залутано" : "Нужно больше крышек"}
      </h5>
      <p className="text-center font-golos text-xs text-mos-muted md:text-sm">
        {notify === "buy"
          ? "Купленный предмет можно использовать в инвентаре"
          : "Проверьте баланс крышек в профиле"}
      </p>
      <button type="button" onClick={onClick} className="og-btn og-btn-primary og-btn-md w-full">
        {notify === "buy" ? "Отлично!" : "Понятно"}
      </button>
    </div>
  );
}
