"use client";

import { useState } from "react";
import CharacterAvatar from "@/components/character-avatar";
import Progress from "@/components/ui/progress";
import GoldCoin from "@/components/ui/gold-coin";
import PopupMenu from "@/components/ui/popup-menu";
import UserMenu from "@/components/profile-header/user-menu";
import { useDevice } from "@/hooks/use-device";
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
  avatarUrl?: string;
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
  avatarUrl,
  selectedSkinId,
  gender,
  user,
}: ProfileTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { isMobile } = useDevice();

  const trigger = (
    <div className="flex h-full w-fit items-center justify-between gap-2 xl:gap-6">
      <div className="flex min-w-[115px] items-center justify-between gap-2 xl:min-w-[180px]">
        <div className="flex w-full flex-col gap-0">
          <div className="flex w-full items-center justify-between gap-2">
            <span
              className="inline-flex shrink-0 items-center gap-1 font-unbounded text-[9px] font-medium text-mos-amber xl:gap-2 xl:text-sm"
              title="Золотые монеты"
            >
              {balance.toLocaleString("ru-RU")}
              <GoldCoin className="mb-px h-3 w-3 xl:mb-0.5 xl:h-5 xl:w-5" />
            </span>
            <h6 className="truncate font-unbounded text-[9px] font-medium text-primaryText xl:text-sm">
              {username}
            </h6>
          </div>
          <div className="flex w-full items-center">
            <Progress
              value={currentXp}
              max={xpToNext}
              size="md"
              showText={isMobile}
              suffix="XP"
              className="w-full"
            />
          </div>
          <div className="hidden w-full items-center justify-between xl:flex">
            <span className="font-unbounded text-[7px] font-light leading-2.5 text-secondaryText xl:text-[10px] xl:leading-4">
              {level} уровень
            </span>
            <span className="font-unbounded text-[7px] font-light leading-2.5 text-secondaryText xl:text-[10px] xl:leading-4">
              {currentXp}/{xpToNext}
            </span>
          </div>
        </div>
      </div>
      <CharacterAvatar
        selectedSkinId={selectedSkinId}
        gender={gender}
        imageSrc={avatarUrl}
        fallbackLetter={avatarLetter || username}
        variant="head"
        className={cn(
          isMobile ? "h-8 w-8 rounded-xl" : "h-11 w-11 rounded-2xl",
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
