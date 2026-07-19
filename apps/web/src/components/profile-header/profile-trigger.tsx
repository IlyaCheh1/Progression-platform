"use client";

import { useState } from "react";
import CharacterAvatar from "@/components/character-avatar";
import ActiveSkillsList from "@/components/talents/active-skills-list";
import { useTalents } from "@/components/talents/talents-provider";
import Progress from "@/components/ui/progress";
import PopupMenu from "@/components/ui/popup-menu";
import UserMenu from "@/components/profile-header/user-menu";
import type { GenderId } from "@/lib/avatars";
import type { OgCharacterId } from "@/lib/characters";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/session";

type ProfileTriggerProps = {
  username: string;
  level: number;
  currentXp: number;
  xpToNext: number;
  avatarLetter: string;
  avatarUrl?: string;
  selectedSkinId: OgCharacterId;
  gender: GenderId;
  user: SessionUser;
};

export default function ProfileTrigger({
  username,
  level,
  currentXp,
  xpToNext,
  avatarLetter,
  avatarUrl,
  selectedSkinId,
  gender,
  user,
}: ProfileTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { favoriteSkills, handleActivate, handleFavourite, loading } = useTalents();

  const trigger = (
    <div className="flex h-full w-fit items-center gap-2 md:gap-6">
      <div className="hidden min-w-[115px] flex-col gap-0.5 md:flex md:min-w-[180px]">
        <div className="flex w-full items-center justify-end gap-2">
          <h6 className="truncate font-unbounded text-[9px] font-medium text-primaryText md:text-sm">
            {username}
          </h6>
        </div>
        <div className="flex w-full items-center justify-between gap-2 text-[7px] font-light leading-2.5 text-secondaryText md:text-[10px] md:leading-4">
          <span className="font-unbounded">{level} уровень</span>
          <span className="font-unbounded">
            {currentXp}/{xpToNext}
          </span>
        </div>
        <div className="flex w-full items-center">
          <Progress value={currentXp} max={xpToNext} size="md" className="w-full" />
        </div>
        <ActiveSkillsList
          skills={favoriteSkills}
          onActivate={handleActivate}
          onFavourite={handleFavourite}
          loading={loading}
          compact
          className="hidden md:block"
        />
      </div>
      <CharacterAvatar
        selectedSkinId={selectedSkinId}
        gender={gender}
        imageSrc={avatarUrl}
        fallbackLetter={avatarLetter || username}
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
        username={username}
        selectedSkinId={selectedSkinId}
        gender={gender}
        avatarUrl={avatarUrl}
        onClose={() => setIsOpen(false)}
      />
    </PopupMenu>
  );
}
