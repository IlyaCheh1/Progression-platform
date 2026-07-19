"use client";

import Link from "next/link";
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

function BackgroundGrid({
  title,
  hint,
  options,
  isOwned,
  isEquipped,
  equippingPrefix,
  equippingId,
  onSelect,
}: {
  title: string;
  hint: string;
  options: BackgroundOption[];
  isOwned: (id: string) => boolean;
  isEquipped: (id: string) => boolean;
  equippingPrefix?: string;
  equippingId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <div className="flex items-end justify-between gap-3">
          <h3 className="font-display text-sm font-medium text-mos-text md:text-base">{title}</h3>
          <Link
            href={routes.store}
            className="text-[11px] text-mos-muted underline-offset-2 hover:text-mos-amber hover:underline md:text-xs"
          >
            Лавка
          </Link>
        </div>
        <p className="font-golos text-[11px] text-mos-muted md:text-xs">{hint}</p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:gap-3">
        {options.map((background) => {
          const owned = isOwned(background.id);
          const equipped = isEquipped(background.id);
          const busy = equippingPrefix ? equippingId === `${equippingPrefix}:${background.id}` : false;
          return (
            <button
              key={`${title}:${background.id}`}
              type="button"
              disabled={!owned || equipped || Boolean(equippingId && equippingPrefix)}
              onClick={() => onSelect(background.id)}
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
              <span className="relative overflow-hidden rounded-xl bg-mos-bg/50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={background.src} alt={background.label} className="aspect-video w-full object-cover" />
                {equipped ? <ActiveBadge /> : null}
                {!owned ? <LockBadge /> : null}
                {!owned ? <span className="absolute inset-0 bg-black/35" aria-hidden /> : null}
              </span>
              <span className="line-clamp-2 font-golos text-[10px] leading-3.5 text-mos-text md:text-xs md:leading-4">
                {busy ? "Применяем…" : background.label}
                {!owned && background.price ? (
                  <span className="mt-0.5 block text-mos-amber">{background.price} зол.</span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </section>
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
  if (loading) {
    return <p className="py-10 text-center text-sm text-mos-muted">Загрузка кастомизации…</p>;
  }

  const settingsOwned = (id: string) =>
    id === SETTINGS_DEFAULT_BACKGROUND_ID || ownership.ownedBackgroundIds.has(id);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h2 className="font-display text-base font-medium text-mos-text md:text-lg">Кастомизация</h2>
        <p className="font-golos text-xs text-mos-muted md:text-sm">
          Фон страницы профиля, шапки настроек и страницы настроек — отдельные настройки.
        </p>
      </header>

      <BackgroundGrid
        title="Фон страницы профиля"
        hint="Фон на экране профиля персонажа (сохраняется в аккаунте)."
        options={PROFILE_BACKGROUNDS}
        isOwned={(id) => ownership.ownedBackgroundIds.has(id)}
        isEquipped={(id) => ownership.equippedProfileBackgroundId === id}
        equippingPrefix="background"
        equippingId={equippingId}
        onSelect={(id) => onSelectProfileBackground(id as BackgroundId)}
      />

      <BackgroundGrid
        title="Фон шапки настроек"
        hint="Баннер в карточке сверху на странице настроек."
        options={SETTINGS_UI_BACKGROUND_OPTIONS}
        isOwned={settingsOwned}
        isEquipped={(id) => settingsHeaderBackgroundId === id}
        equippingId={null}
        onSelect={(id) => onSelectSettingsHeaderBackground(id as SettingsBackgroundChoice)}
      />

      <BackgroundGrid
        title="Фон страницы настроек"
        hint="Фон всей страницы настроек. Не влияет на профиль."
        options={SETTINGS_UI_BACKGROUND_OPTIONS}
        isOwned={settingsOwned}
        isEquipped={(id) => settingsPageBackgroundId === id}
        equippingId={null}
        onSelect={(id) => onSelectSettingsPageBackground(id as SettingsBackgroundChoice)}
      />

      <section className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-3">
          <h3 className="font-display text-sm font-medium text-mos-text md:text-base">Персонаж</h3>
          <Link
            href={routes.store}
            className="text-[11px] text-mos-muted underline-offset-2 hover:text-mos-amber hover:underline md:text-xs"
          >
            Лавка
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:gap-3">
          {OG_CHARACTERS.map((character) => {
            const owned = ownership.ownedCharacterIds.has(character.id);
            const equipped = ownership.equippedCharacterId === character.id;
            const busy = equippingId === `character:${character.id}`;
            return (
              <button
                key={character.id}
                type="button"
                disabled={!owned || equipped || Boolean(equippingId)}
                onClick={() => onSelectCharacter(character.id)}
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
                <span className="relative overflow-hidden rounded-xl bg-mos-bg/50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={character.thumbnailSrc || character.avatarSrc}
                    alt={character.name}
                    className="aspect-[3/4] w-full object-cover object-top"
                  />
                  {equipped ? <ActiveBadge /> : null}
                  {!owned ? <LockBadge /> : null}
                  {!owned ? <span className="absolute inset-0 bg-black/35" aria-hidden /> : null}
                </span>
                <span className="line-clamp-2 font-golos text-[10px] leading-3.5 text-mos-text md:text-xs md:leading-4">
                  {busy ? "Применяем…" : character.name}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {error ? <p className="text-center text-sm text-mos-danger">{error}</p> : null}
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
