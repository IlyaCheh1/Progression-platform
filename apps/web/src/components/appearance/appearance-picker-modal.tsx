"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { InventoryBackgroundItem, InventoryCharacterItem } from "@/hooks/use-appearance-inventory";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

export type AppearancePickerMode = "character" | "background";

type AppearancePickerModalProps = {
  open: boolean;
  mode: AppearancePickerMode;
  title: string;
  characters: InventoryCharacterItem[];
  backgrounds: InventoryBackgroundItem[];
  equippingId: string | null;
  loading?: boolean;
  error?: string;
  onClose: () => void;
  onSelectCharacter: (characterId: string) => void;
  onSelectBackground: (backgroundId: string) => void;
};

function IconClose() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}

function IconCamera() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.75">
      <path
        d="M4 8h3l1.5-2h7L17 8h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

export default function AppearancePickerModal({
  open,
  mode,
  title,
  characters,
  backgrounds,
  equippingId,
  loading = false,
  error,
  onClose,
  onSelectCharacter,
  onSelectBackground,
}: AppearancePickerModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, open]);

  if (!open || typeof document === "undefined") return null;

  const items =
    mode === "character"
      ? characters.map((item) => ({
          key: item.holding.key,
          refId: item.characterId,
          title: item.name,
          imageSrc: item.imageSrc,
          equipped: item.equipped,
          aspect: "portrait" as const,
          onSelect: () => onSelectCharacter(item.characterId),
        }))
      : backgrounds.map((item) => ({
          key: item.holding.key,
          refId: item.background.id,
          title: item.background.label,
          imageSrc: item.background.src,
          equipped: item.equipped,
          aspect: "landscape" as const,
          onSelect: () => onSelectBackground(item.background.id),
        }));

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm md:items-center md:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="appearance-picker-title"
        className="bg-secondaryBg flex max-h-[88lvh] w-full max-w-[640px] flex-col overflow-hidden rounded-t-[28px] shadow-2xl md:rounded-[32px]"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4 md:px-6">
          <div className="flex items-center gap-2">
            <span className="text-mos-amber">
              <IconCamera />
            </span>
            <h2 id="appearance-picker-title" className="font-display text-sm font-medium text-mos-text md:text-base">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-mos-muted transition-colors hover:bg-white/5 hover:text-mos-text"
            aria-label="Закрыть"
          >
            <IconClose />
          </button>
        </div>

        <div className="mobile-game-scroll flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-5">
          {loading ? (
            <p className="py-10 text-center text-sm text-mos-muted">Загрузка…</p>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="font-display text-sm text-mos-text">Пока нет доступных предметов</p>
              <p className="max-w-sm text-xs text-mos-muted">
                Получите персонажей и фоны в лавке или завершите онбординг.
              </p>
              <Link href={routes.store} className="og-btn og-btn-primary og-btn-sm" onClick={onClose}>
                Открыть лавку
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:gap-3">
              {items.map((item) => {
                const busy = equippingId === `${mode}:${item.refId}`;
                return (
                  <button
                    key={item.key}
                    type="button"
                    disabled={item.equipped || Boolean(equippingId)}
                    onClick={item.onSelect}
                    className={cn(
                      "group flex flex-col gap-2 rounded-2xl border p-2 text-left transition-colors md:rounded-[20px] md:p-2.5",
                      item.equipped
                        ? "border-mos-amber/70 bg-mos-amber/10"
                        : "border-white/10 bg-mos-bg/30 hover:border-mos-amber/40 hover:bg-white/5",
                      busy && "opacity-70",
                    )}
                  >
                    <span className="relative overflow-hidden rounded-xl bg-mos-bg/50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.imageSrc}
                        alt={item.title}
                        className={cn(
                          "w-full object-cover",
                          item.aspect === "portrait" ? "aspect-[3/4] object-top" : "aspect-video",
                        )}
                      />
                      {item.equipped ? (
                        <span className="absolute left-1 top-1 rounded-md bg-mos-amber px-1.5 py-0.5 font-display text-[9px] font-bold uppercase text-mos-bg">
                          Активно
                        </span>
                      ) : null}
                    </span>
                    <span className="line-clamp-2 font-golos text-[10px] leading-3.5 text-mos-text md:text-xs md:leading-4">
                      {busy ? "Применяем…" : item.title}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          {error ? <p className="mt-4 text-center text-sm text-mos-danger">{error}</p> : null}
        </div>

        <div className="border-t border-white/10 px-4 py-3 md:px-6">
          <Link
            href={routes.inventory}
            onClick={onClose}
            className="font-golos text-xs text-mos-muted underline-offset-2 hover:text-mos-amber hover:underline md:text-sm"
          >
            Открыть инвентарь
          </Link>
        </div>
      </div>
    </div>,
    document.body,
  );
}
