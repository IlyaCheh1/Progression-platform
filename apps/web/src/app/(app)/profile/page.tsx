"use client";

import { useEffect, useState } from "react";
import { content } from "@/lib/content";
import CharacterStage from "@/components/character-stage";
import { useAvatarPresentation } from "@/components/character-avatar";
import { usePlayerProfile } from "@/hooks/use-player-profile";
import { loadSession } from "@/lib/session";

export default function ProfilePage() {
  const [user] = useState(() => (typeof window !== "undefined" ? loadSession() : null));
  const { profile } = usePlayerProfile(user);
  const presentation = useAvatarPresentation(profile ?? undefined);
  const [masteryTotal, setMasteryTotal] = useState(0);
  const daily = content.quests.filter((q) => q.type === "DAILY").slice(0, 3);

  useEffect(() => {
    if (!profile) return;
    const sum = Object.values(profile.mastery ?? {}).reduce((acc, value) => acc + Number(value), 0);
    setMasteryTotal(sum);
  }, [profile]);

  const username = profile?.username || user?.name || "Ученик";
  const level = profile?.level ?? 1;
  const currentXp = profile?.xp ?? 0;
  const xpToNext = profile?.xpToNextLevel ?? 500;
  const progress = xpToNext > 0 ? Math.min(100, Math.round((currentXp / xpToNext) * 100)) : 0;

  return (
    <div className="relative min-h-[calc(100vh-60px)]">
      <CharacterStage
        username={username}
        selectedSkinId={presentation.selectedSkinId}
        gender={presentation.gender}
        backgroundSrc={presentation.backgroundSrc}
      />

      <aside className="absolute left-4 top-4 z-20 w-[min(100%,280px)] space-y-4 border border-mos-line/50 bg-mos-bg/75 p-4 backdrop-blur md:left-8 md:top-8">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-mos-muted">Уровень</p>
          <p className="font-display text-3xl text-mos-amber">{level}</p>
          <div className="mt-2 h-1.5 w-full bg-mos-stone">
            <div
              className="h-full bg-mos-amber shadow-[0_0_12px_var(--mos-amber-glow)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1 text-[10px] text-mos-muted">
            {currentXp}/{xpToNext} XP
          </p>
        </div>
        {presentation.character && (
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-mos-muted">Персонаж</p>
            <p className="text-sm text-mos-text">{presentation.character.name}</p>
            {presentation.character.bonus && (
              <p className="text-xs text-mos-amber">{presentation.character.bonus}</p>
            )}
          </div>
        )}
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-mos-muted">Мастерство (units)</p>
          <p className="font-display text-xl text-mos-text">{masteryTotal.toLocaleString("ru-RU")}</p>
        </div>
        <div>
          <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-mos-amber">Закреплённые задания</p>
          <ul className="space-y-2">
            {daily.map((q) => (
              <li key={q.key} className="border border-mos-line/30 px-3 py-2 text-sm">
                <p className="text-mos-text">{q.title}</p>
                <p className="text-xs text-mos-muted">{q.xp} XP</p>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
