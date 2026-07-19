"use client";

import { useState } from "react";
import CharacterAvatar from "@/components/character-avatar";
import Progress from "@/components/ui/progress";
import PopupMenu from "@/components/ui/popup-menu";
import UserMenu from "@/components/profile-header/user-menu";
import type { GenderId } from "@/lib/avatars";
import type { OgCharacterId } from "@/lib/characters";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/session";

type ProfileTriggerProps = {
  username: string;
  balance: number;
  level: number;
  currentXp: number;
  xpToNext: number;
  avatarLetter: string;
  selectedSkinId: OgCharacterId;
  gender: GenderId;
  user: SessionUser;
};

export default function ProfileTrigger({
  username,
  balance,
  level,
  currentXp,
  xpToNext,
  avatarLetter,
  selectedSkinId,
  gender,
  user,
}: ProfileTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const trigger = (
    <div className="flex h-full w-fit items-center gap-2 md:gap-4">
      <div className="hidden min-w-[140px] flex-col gap-1 md:flex md:min-w-[180px]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="font-display text-xs text-mos-text md:text-sm">
              {balance.toLocaleString("ru-RU")}
            </span>
            <span className="text-[10px] text-mos-amber" aria-hidden>
              ◆
            </span>
          </div>
          <span className="truncate font-display text-xs text-mos-text md:text-sm">{username}</span>
        </div>
        <Progress value={currentXp} max={xpToNext} size="md" />
        <div className="flex items-center justify-between text-[10px] text-mos-muted">
          <span>{level} уровень</span>
          <span>
            {currentXp}/{xpToNext} XP
          </span>
        </div>
      </div>
      <CharacterAvatar
        selectedSkinId={selectedSkinId}
        gender={gender}
        variant="head"
        className={cn(
          "h-9 w-9 rounded-2xl md:h-11 md:w-11",
          isOpen && "ring-2 ring-mos-amber shadow-[0_0_12px_var(--mos-amber-glow)]",
        )}
      />
    </div>
  );

  return (
    <PopupMenu
      trigger={trigger}
      placement="bottom-left"
      isOverlay
      isOpen={isOpen}
      onOpenChange={setIsOpen}
    >
      <UserMenu
        user={user}
        avatarLetter={avatarLetter}
        selectedSkinId={selectedSkinId}
        gender={gender}
        onClose={() => setIsOpen(false)}
      />
    </PopupMenu>
  );
}
