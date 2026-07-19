"use client";

import AppearanceEditBadge from "@/components/appearance/appearance-edit-badge";
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
  backgroundSrc: string;
  online?: boolean;
  onEditAvatar?: () => void;
  onEditBackground?: () => void;
};

export default function SettingsProfileHeader({
  username,
  rolesLabel,
  level,
  currentXp,
  xpToNext,
  selectedSkinId,
  gender,
  backgroundSrc,
  online = true,
  onEditAvatar,
  onEditBackground,
}: SettingsProfileHeaderProps) {
  const progressPercent = xpToNext > 0 ? (currentXp / xpToNext) * 100 : 0;

  return (
    <div className="bg-secondaryBg mx-auto w-full overflow-hidden rounded-2xl backdrop-blur-[20px] md:rounded-[32px]">
      <button
        type="button"
        onClick={onEditBackground}
        disabled={!onEditBackground}
        className={cn(
          "group relative block h-[88px] w-full overflow-hidden md:h-[120px]",
          onEditBackground && "cursor-pointer",
          !onEditBackground && "cursor-default",
        )}
        aria-label={onEditBackground ? "Сменить фон профиля" : undefined}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={backgroundSrc} alt="" className="h-full w-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-[#1a1a1d]" />
        {onEditBackground ? <AppearanceEditBadge label="Сменить фон" className="right-3 top-3 md:right-4 md:top-4" /> : null}
      </button>

      <div className="relative flex flex-col gap-4 px-4 pb-4 md:gap-5 md:px-8 md:pb-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex items-end gap-4 md:gap-6">
            <button
              type="button"
              onClick={onEditAvatar}
              disabled={!onEditAvatar}
              className={cn(
                "group relative -mt-10 shrink-0 md:-mt-12",
                onEditAvatar && "cursor-pointer rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mos-amber",
                !onEditAvatar && "cursor-default",
              )}
              aria-label={onEditAvatar ? "Сменить аватар" : undefined}
            >
              <ProgressCircle
                progress={progressPercent}
                selectedSkinId={selectedSkinId}
                gender={gender}
                size="lg"
                width={6}
                showPercentage
              />
              {onEditAvatar ? (
                <AppearanceEditBadge label="Аватар" className="bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap" />
              ) : null}
            </button>

            <div className="flex min-w-0 flex-col gap-2 pb-1 md:gap-2.5">
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

        <div className="flex flex-col gap-2 md:hidden">
          <div className="flex items-center justify-between">
            <p className="font-display text-sm font-medium text-mos-text">Уровень {level}</p>
            <p className="font-display text-xs text-mos-muted">
              {currentXp}/{xpToNext} XP
            </p>
          </div>
          <Progress value={currentXp} max={xpToNext} size="md" className="w-full" />
        </div>
      </div>
    </div>
  );
}
