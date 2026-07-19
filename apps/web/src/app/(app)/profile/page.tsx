"use client";

import { useState } from "react";
import CharacterStage from "@/components/character-stage";
import DailyTasks from "@/components/daily-tasks";
import LandscapeLock from "@/components/landscape-lock";
import WeaponMasteryPanel from "@/components/weapon-mastery-panel";
import { useAvatarPresentation } from "@/components/character-avatar";
import { usePlayerProfile } from "@/hooks/use-player-profile";
import { content } from "@/lib/content";
import { profileDisplayName } from "@/lib/profile-menu";
import { loadSession } from "@/lib/session";

export default function ProfilePage() {
  const [user] = useState(() => (typeof window !== "undefined" ? loadSession() : null));
  const { profile } = usePlayerProfile(user);
  const presentation = useAvatarPresentation(profile ?? undefined);
  const daily = content.quests.filter((q) => q.type === "DAILY").slice(0, 3);

  const username = profileDisplayName(profile, user);
  const level = profile?.level ?? 1;
  const currentXp = profile?.xp ?? 0;
  const xpToNext = profile?.xpToNextLevel ?? 500;

  return (
    <CharacterStage
      username={username}
      selectedSkinId={presentation.selectedSkinId}
      gender={presentation.gender}
      backgroundSrc={presentation.backgroundSrc}
      backgroundKey={profile?.backgroundKey}
    >
      <LandscapeLock />
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
  );
}
