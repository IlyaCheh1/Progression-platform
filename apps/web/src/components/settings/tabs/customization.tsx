"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { OG_CHARACTERS, type OgCharacterId } from "@/lib/characters";
import { PROFILE_BACKGROUNDS, type BackgroundId } from "@/lib/backgrounds";
import { routes } from "@/lib/routes";
import {
  SETTINGS_DEFAULT_BACKGROUND_ID,
  SETTINGS_DEFAULT_BACKGROUND_LABEL,
  SETTINGS_DEFAULT_BACKGROUND_SRC,
  type SettingsAppearanceLocal,
  type SettingsBackgroundChoice,
} from "@/lib/settings-local";
import { cn } from "@/lib/utils";

export type CustomizationOwnership = {
  ownedCharacterIds: Set<string>;
  ownedBackgroundIds: Set<string>;
  equippedCharacterId?: string;
  equippedProfileBackgroundId?: string;
};

type BackgroundOption = {
  id: SettingsBackgroundChoice | BackgroundId;
  label: string;
  src: string;
  price?: number;
  unlock?: "default" | "purchase";
};

type PickerKind = "profile-bg" | "header-bg" | "page-bg" | "character";

const SETTINGS_UI_BACKGROUND_OPTIONS: BackgroundOption[] = [
  {
    id: SETTINGS_DEFAULT_BACKGROUND_ID,
    label: SETTINGS_DEFAULT_BACKGROUND_LABEL,
    src: SETTINGS_DEFAULT_BACKGROUND_SRC,
    unlock: "default",
  },
  ...PROFILE_BACKGROUNDS.map((background) => ({
    id: background.id,
    label: background.label,
    src: background.src,
    price: background.price,
    unlock: background.unlock,
  })),
];

type CustomizationTabProps = {
  ownership: CustomizationOwnership;
  settingsPageBackgroundId: SettingsBackgroundChoice;
  settingsHeaderBackgroundId: SettingsBackgroundChoice;
  equippingId: string | null;
  loading?: boolean;
  error?: string;
  onSelectCharacter: (characterId: OgCharacterId) => void;
  onSelectProfileBackground: (backgroundId: BackgroundId) => void;
  onSelectSettingsPageBackground: (backgroundId: SettingsBackgroundChoice) => void;
  onSelectSettingsHeaderBackground: (backgroundId: SettingsBackgroundChoice) => void;
};

function LockBadge() {
  return (
    <span className="absolute left-1 top-1 rounded-md bg-black/70 px-1.5 py-0.5 font-display text-[9px] font-bold uppercase text-mos-muted">
      Закрыто
    </span>
  );
}

function ActiveBadge() {
  return (
    <span className="absolute left-1 top-1 rounded-md bg-mos-amber px-1.5 py-0.5 font-display text-[9px] font-bold uppercase text-mos-bg">
      Активно
    </span>
  );
}

function IconClose() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}

function IconChevron() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function resolveBackgroundOption(
  id: SettingsBackgroundChoice | BackgroundId | undefined,
  options: BackgroundOption[],
): BackgroundOption | undefined {
  if (!id) return undefined;
  return options.find((item) => item.id === id);
}

function CustomizationField({
  label,
  hint,
  previewSrc,
  previewAlt,
  previewAspect,
  valueLabel,
  locked,
  onOpen,
}: {
  label: string;
  hint: string;
  previewSrc: string;
  previewAlt: string;
  previewAspect: "portrait" | "landscape";
  valueLabel: string;
  locked?: boolean;
  onOpen: () => void;
}) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <h3 className="font-display text-sm font-medium text-mos-text md:text-base">{label}</h3>
        <p className="font-golos text-[11px] text-mos-muted md:text-xs">{hint}</p>
      </div>
      <button
        type="button"
        onClick={onOpen}
        className="group flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-mos-bg/30 p-2.5 text-left transition-colors hover:border-mos-amber/40 hover:bg-white/5 md:rounded-[20px] md:p-3"
      >
        <span
          className={cn(
            "relative shrink-0 overflow-hidden rounded-xl bg-mos-bg/50",
            previewAspect === "portrait" ? "h-16 w-12" : "h-14 w-24",
          )}
        >
          <Image
            src={previewSrc}
            alt={previewAlt}
            fill
            sizes={previewAspect === "portrait" ? "48px" : "96px"}
            className={cn(
              "object-cover",
              previewAspect === "portrait" ? "object-top" : "object-center",
            )}
          />
          {locked ? <span className="absolute inset-0 bg-black/35" aria-hidden /> : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-golos text-[10px] uppercase tracking-wider text-mos-muted">Сейчас</span>
          <span className="mt-0.5 block truncate font-golos text-sm text-mos-text">{valueLabel}</span>
        </span>
        <span className="flex items-center gap-1 font-golos text-xs text-mos-amber transition-colors group-hover:text-mos-text">
          Изменить
          <IconChevron />
        </span>
      </button>
    </section>
  );
}

function CustomizationPickerModal({
  open,
  title,
  storeHint,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  storeHint?: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const titleId = useId();

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

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm md:items-center md:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-secondaryBg flex max-h-[88lvh] w-full max-w-[640px] flex-col overflow-hidden rounded-t-[28px] shadow-2xl md:rounded-[32px]"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4 md:px-6">
          <h2 id={titleId} className="font-display text-sm font-medium text-mos-text md:text-base">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-mos-muted transition-colors hover:bg-white/5 hover:text-mos-text"
            aria-label="Закрыть"
          >
            <IconClose />
          </button>
        </div>

        <div className="mobile-game-scroll flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-5">{children}</div>

        {storeHint ? (
          <div className="border-t border-white/10 px-4 py-3 md:px-6">
            <Link
              href={routes.store}
              onClick={onClose}
              className="font-golos text-xs text-mos-muted underline-offset-2 hover:text-mos-amber hover:underline md:text-sm"
            >
              Открыть лавку
            </Link>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

function OptionGrid({
  options,
  aspect,
  isOwned,
  isEquipped,
  equippingPrefix,
  equippingId,
  onSelect,
}: {
  options: Array<{ id: string; label: string; src: string; price?: number }>;
  aspect: "portrait" | "landscape";
  isOwned: (id: string) => boolean;
  isEquipped: (id: string) => boolean;
  equippingPrefix?: string;
  equippingId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:gap-3">
      {options.map((option) => {
        const owned = isOwned(option.id);
        const equipped = isEquipped(option.id);
        const busy = equippingPrefix ? equippingId === `${equippingPrefix}:${option.id}` : false;
        return (
          <button
            key={option.id}
            type="button"
            disabled={!owned || equipped || Boolean(equippingId && equippingPrefix)}
            onClick={() => onSelect(option.id)}
            className={cn(
              "group flex flex-col gap-2 rounded-2xl border p-2 text-left transition-colors md:rounded-[20px] md:p-2.5",
              equipped
                ? "border-mos-amber/70 bg-mos-amber/10"
                : owned
                  ? "border-white/10 bg-mos-bg/30 hover:border-mos-amber/40 hover:bg-white/5"
                  : "border-white/5 bg-mos-bg/20 opacity-70",
              busy && "opacity-70",
            )}
          >
            <span
              className={cn(
                "relative block w-full overflow-hidden rounded-xl bg-mos-bg/50",
                aspect === "portrait" ? "aspect-[3/4]" : "aspect-video",
              )}
            >
              <Image
                src={option.src}
                alt={option.label}
                fill
                sizes="(max-width: 767px) 45vw, 180px"
                loading="lazy"
                className={cn("object-cover", aspect === "portrait" ? "object-top" : "object-center")}
              />
              {equipped ? <ActiveBadge /> : null}
              {!owned ? <LockBadge /> : null}
              {!owned ? <span className="absolute inset-0 bg-black/35" aria-hidden /> : null}
            </span>
            <span className="line-clamp-2 font-golos text-[10px] leading-3.5 text-mos-text md:text-xs md:leading-4">
              {busy ? "Применяем…" : option.label}
              {!owned && option.price ? (
                <span className="mt-0.5 block text-mos-amber">{option.price} зол.</span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function CustomizationTab({
  ownership,
  settingsPageBackgroundId,
  settingsHeaderBackgroundId,
  equippingId,
  loading = false,
  error,
  onSelectCharacter,
  onSelectProfileBackground,
  onSelectSettingsPageBackground,
  onSelectSettingsHeaderBackground,
}: CustomizationTabProps) {
  const [picker, setPicker] = useState<PickerKind | null>(null);

  const profileBackground = useMemo(
    () =>
      resolveBackgroundOption(
        ownership.equippedProfileBackgroundId as BackgroundId | undefined,
        PROFILE_BACKGROUNDS,
      ) ?? PROFILE_BACKGROUNDS[0],
    [ownership.equippedProfileBackgroundId],
  );
  const headerBackground = useMemo(
    () =>
      resolveBackgroundOption(settingsHeaderBackgroundId, SETTINGS_UI_BACKGROUND_OPTIONS) ??
      SETTINGS_UI_BACKGROUND_OPTIONS[0],
    [settingsHeaderBackgroundId],
  );
  const pageBackground = useMemo(
    () =>
      resolveBackgroundOption(settingsPageBackgroundId, SETTINGS_UI_BACKGROUND_OPTIONS) ??
      SETTINGS_UI_BACKGROUND_OPTIONS[0],
    [settingsPageBackgroundId],
  );
  const character = useMemo(
    () =>
      OG_CHARACTERS.find((item) => item.id === ownership.equippedCharacterId) ?? OG_CHARACTERS[0],
    [ownership.equippedCharacterId],
  );

  const settingsOwned = (id: string) =>
    id === SETTINGS_DEFAULT_BACKGROUND_ID || ownership.ownedBackgroundIds.has(id);

  const closePicker = () => setPicker(null);

  const pickerMeta: Record<
    PickerKind,
    { title: string; storeHint: boolean }
  > = {
    "profile-bg": { title: "Фон страницы профиля", storeHint: true },
    "header-bg": { title: "Фон шапки настроек", storeHint: true },
    "page-bg": { title: "Фон страницы настроек", storeHint: true },
    character: { title: "Персонаж", storeHint: true },
  };

  if (loading) {
    return <p className="py-10 text-center text-sm text-mos-muted">Загрузка кастомизации…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h2 className="font-display text-base font-medium text-mos-text md:text-lg">Кастомизация</h2>
        <p className="font-golos text-xs text-mos-muted md:text-sm">
          Нажмите на поле, чтобы выбрать фон или персонажа во всплывающем окне.
        </p>
      </header>

      <CustomizationField
        label="Фон страницы профиля"
        hint="Фон на экране профиля персонажа (сохраняется в аккаунте)."
        previewSrc={profileBackground.src}
        previewAlt={profileBackground.label}
        previewAspect="landscape"
        valueLabel={profileBackground.label}
        onOpen={() => setPicker("profile-bg")}
      />

      <CustomizationField
        label="Фон шапки настроек"
        hint="Баннер в карточке сверху на странице настроек."
        previewSrc={headerBackground.src}
        previewAlt={headerBackground.label}
        previewAspect="landscape"
        valueLabel={headerBackground.label}
        onOpen={() => setPicker("header-bg")}
      />

      <CustomizationField
        label="Фон страницы настроек"
        hint="Фон всей страницы настроек. Не влияет на профиль."
        previewSrc={pageBackground.src}
        previewAlt={pageBackground.label}
        previewAspect="landscape"
        valueLabel={pageBackground.label}
        onOpen={() => setPicker("page-bg")}
      />

      <CustomizationField
        label="Персонаж"
        hint="Внешность персонажа на экране профиля."
        previewSrc={character.thumbnailSrc || character.avatarSrc}
        previewAlt={character.name}
        previewAspect="portrait"
        valueLabel={character.name}
        locked={!ownership.ownedCharacterIds.has(character.id)}
        onOpen={() => setPicker("character")}
      />

      {error ? <p className="text-center text-sm text-mos-danger">{error}</p> : null}

      <CustomizationPickerModal
        open={picker !== null}
        title={picker ? pickerMeta[picker].title : ""}
        storeHint={picker ? pickerMeta[picker].storeHint : false}
        onClose={closePicker}
      >
        {picker === "profile-bg" ? (
          <OptionGrid
            options={PROFILE_BACKGROUNDS}
            aspect="landscape"
            isOwned={(id) => ownership.ownedBackgroundIds.has(id)}
            isEquipped={(id) => ownership.equippedProfileBackgroundId === id}
            equippingPrefix="background"
            equippingId={equippingId}
            onSelect={(id) => {
              onSelectProfileBackground(id as BackgroundId);
              closePicker();
            }}
          />
        ) : null}

        {picker === "header-bg" ? (
          <OptionGrid
            options={SETTINGS_UI_BACKGROUND_OPTIONS}
            aspect="landscape"
            isOwned={settingsOwned}
            isEquipped={(id) => settingsHeaderBackgroundId === id}
            equippingId={null}
            onSelect={(id) => {
              onSelectSettingsHeaderBackground(id as SettingsBackgroundChoice);
              closePicker();
            }}
          />
        ) : null}

        {picker === "page-bg" ? (
          <OptionGrid
            options={SETTINGS_UI_BACKGROUND_OPTIONS}
            aspect="landscape"
            isOwned={settingsOwned}
            isEquipped={(id) => settingsPageBackgroundId === id}
            equippingId={null}
            onSelect={(id) => {
              onSelectSettingsPageBackground(id as SettingsBackgroundChoice);
              closePicker();
            }}
          />
        ) : null}

        {picker === "character" ? (
          <OptionGrid
            options={OG_CHARACTERS.map((item) => ({
              id: item.id,
              label: item.name,
              src: item.thumbnailSrc || item.avatarSrc,
            }))}
            aspect="portrait"
            isOwned={(id) => ownership.ownedCharacterIds.has(id)}
            isEquipped={(id) => ownership.equippedCharacterId === id}
            equippingPrefix="character"
            equippingId={equippingId}
            onSelect={(id) => {
              onSelectCharacter(id as OgCharacterId);
              closePicker();
            }}
          />
        ) : null}
      </CustomizationPickerModal>
    </div>
  );
}

export function resolveSettingsBackgroundSrc(choice: SettingsBackgroundChoice): string {
  if (choice === SETTINGS_DEFAULT_BACKGROUND_ID) {
    return SETTINGS_DEFAULT_BACKGROUND_SRC;
  }
  return (
    PROFILE_BACKGROUNDS.find((item) => item.id === choice)?.src ?? SETTINGS_DEFAULT_BACKGROUND_SRC
  );
}

export type { SettingsAppearanceLocal };
