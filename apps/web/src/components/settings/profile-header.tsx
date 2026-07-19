"use client";

import CharacterAvatar from "@/components/character-avatar";
import Progress from "@/components/ui/progress";
import ProgressCircle from "@/components/ui/progress-circle";
import type { GenderId } from "@/lib/avatars";
import type { OgCharacterId } from "@/lib/characters";
import { cn } from "@/lib/utils";

type SettingsProfileHeaderProps = {
  username: string;
  rolesLabel: string;
  level: number;
  currentXp: number;
  xpToNext: number;
  selectedSkinId: OgCharacterId;
  gender: GenderId;
  online?: boolean;
};

export default function SettingsProfileHeader({
  username,
  rolesLabel,
  level,
  currentXp,
  xpToNext,
  selectedSkinId,
  gender,
  online = true,
}: SettingsProfileHeaderProps) {
  const progressPercent = xpToNext > 0 ? (currentXp / xpToNext) * 100 : 0;

  return (
    <div className="bg-secondaryBg mx-auto flex h-auto min-h-[166px] w-full items-start justify-between gap-4 overflow-hidden rounded-2xl p-4 backdrop-blur-[20px] md:min-h-[226px] md:rounded-[32px] md:p-8">
      <div className="flex items-start gap-4 md:gap-6">
        <ProgressCircle
          progress={progressPercent}
          selectedSkinId={selectedSkinId}
          gender={gender}
          size="lg"
          width={6}
          showPercentage
        />

        <div className="flex h-full flex-col items-start justify-start gap-2.5 md:gap-3">
          <div className="flex flex-wrap items-start gap-2">
            {rolesLabel.split(" · ").filter(Boolean).map((tag) => (
              <span
                key={tag}
                className={cn(
                  "rounded-lg px-2 py-0.5 text-[10px] font-medium text-mos-text md:text-xs",
                  "bg-[linear-gradient(238deg,#1a1a1d,#0b0b0c)]",
                )}
              >
                {tag}
              </span>
            ))}
          </div>
          <p className="font-display text-base font-medium leading-5 text-mos-text md:text-2xl md:leading-7">
            {username}
          </p>
          <div className="flex items-center gap-2 text-xs text-mos-muted md:text-sm">
            <span className={cn("h-2 w-2 rounded-full", online ? "bg-[#7dba5a]" : "bg-mos-muted")} />
            {online ? "В сети" : "Не в сети"}
          </div>
          <CharacterAvatar
            selectedSkinId={selectedSkinId}
            gender={gender}
            variant="head"
            className="mt-1 h-10 w-10 rounded-xl md:hidden"
          />
        </div>
      </div>

      <div className="hidden min-w-[160px] flex-col items-end gap-3 md:flex md:min-w-[220px]">
        <div className="flex w-full items-center justify-end gap-2">
          <p className="font-display text-sm font-medium text-mos-text md:text-[15px]">Уровень</p>
          <div className="flex min-w-[42px] items-center justify-center rounded-xl bg-mos-bg px-2 py-0.5">
            <p className="font-display text-sm font-medium text-mos-text md:text-[15px]">{level}</p>
          </div>
        </div>
        <Progress value={currentXp} max={xpToNext} size="xl" showText suffix="XP" className="w-full" />
      </div>
    </div>
  );
}
