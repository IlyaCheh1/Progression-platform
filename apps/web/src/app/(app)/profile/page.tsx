"use client";

import { useState } from "react";
import AppearancePickerModal from "@/components/appearance/appearance-picker-modal";
import CharacterStage from "@/components/character-stage";
import DailyTasks from "@/components/daily-tasks";
import WeaponMasteryPanel from "@/components/weapon-mastery-panel";
import { useAvatarPresentation } from "@/components/character-avatar";
import { useAppearanceInventory } from "@/hooks/use-appearance-inventory";
import { usePlayerProfile } from "@/hooks/use-player-profile";
import { content } from "@/lib/content";
import { profileDisplayName } from "@/lib/profile-menu";
import { loadSession } from "@/lib/session";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const [user] = useState(() => (typeof window !== "undefined" ? loadSession() : null));
  const { profile, setProfile } = usePlayerProfile(user);
  const presentation = useAvatarPresentation(profile ?? undefined);
  const appearance = useAppearanceInventory(user, { onProfileUpdated: setProfile });
  const [pickerOpen, setPickerOpen] = useState(false);
  const daily = content.quests.filter((q) => q.type === "DAILY").slice(0, 3);

  const username = profileDisplayName(profile, user);
  const level = profile?.level ?? 1;
  const currentXp = profile?.xp ?? 0;
  const xpToNext = profile?.xpToNextLevel ?? 500;

  async function handleSelectCharacter(characterId: string) {
    const ok = await appearance.equipCharacter(characterId);
    if (ok) setPickerOpen(false);
  }

  return (
    <>
      <CharacterStage
        username={username}
        selectedSkinId={presentation.selectedSkinId}
        gender={presentation.gender}
        backgroundSrc={presentation.backgroundSrc}
        backgroundKey={profile?.backgroundKey}
      >
        <DailyTasks
          userLevel={level}
          currentXp={currentXp}
          xpToNext={xpToNext}
          tasks={daily}
          selectedSkinId={presentation.selectedSkinId}
          gender={presentation.gender}
          avatarUrl={profile?.avatarUrl}
          fallbackLetter={username}
          className="absolute left-4 top-0 z-20 mt-8 md:left-8 md:mt-[72px]"
        />

        <WeaponMasteryPanel
          mastery={profile?.mastery}
          ranks={profile?.ranks}
          className="absolute right-4 top-0 z-20 mt-8 md:right-8 md:mt-[72px]"
        />

        <div className="absolute bottom-24 left-1/2 z-30 flex -translate-x-1/2 flex-wrap items-center justify-center gap-2 md:bottom-32">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className={cn(
              "og-btn og-btn-secondary og-btn-sm inline-flex items-center gap-2 uppercase",
              appearance.equippingId?.startsWith("character:") && "opacity-70",
            )}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.75">
              <path
                d="M4 8h3l1.5-2h7L17 8h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="13" r="3.5" />
            </svg>
            Сменить образ
          </button>
        </div>

        <div className="absolute bottom-3 right-3 z-20 flex flex-wrap justify-end gap-2 md:bottom-4 md:right-4">
          <a
            href="/legal/offer"
            className="font-golos text-[8px] font-medium leading-3 text-mos-text underline opacity-50 transition-opacity duration-200 hover:opacity-100 md:text-xs md:leading-4"
          >
            Публичная оферта
          </a>
          <a
            href="/legal/terms"
            className="font-golos text-[8px] font-medium leading-3 text-mos-text underline opacity-50 transition-opacity duration-200 hover:opacity-100 md:text-xs md:leading-4"
          >
            Пользовательское соглашение
          </a>
          <a
            href="/legal/privacy"
            className="font-golos text-[8px] font-medium leading-3 text-mos-text underline opacity-50 transition-opacity duration-200 hover:opacity-100 md:text-xs md:leading-4"
          >
            Политика конфиденциальности
          </a>
        </div>
      </CharacterStage>

      <AppearancePickerModal
        open={pickerOpen}
        mode="character"
        title="Выберите образ"
        characters={appearance.characters}
        backgrounds={appearance.backgrounds}
        equippingId={appearance.equippingId}
        loading={appearance.loading}
        error={appearance.error}
        onClose={() => setPickerOpen(false)}
        onSelectCharacter={(characterId) => void handleSelectCharacter(characterId)}
        onSelectBackground={() => undefined}
      />
    </>
  );
}
