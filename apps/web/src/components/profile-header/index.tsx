"use client";

import Link from "next/link";
import AppLogo from "@/components/app-logo";
import ProfileTrigger from "@/components/profile-header/profile-trigger";
import WitcherNav from "@/components/profile-header/witcher-nav";
import type { SessionUser } from "@/lib/session";

type ProfileHeaderProps = {
  user: SessionUser;
  username: string;
  balance: number;
  level: number;
  currentXp: number;
  xpToNext: number;
  avatarLetter: string;
  avatarUrl?: string;
  selectedSkinId: import("@/lib/characters").OgCharacterId;
  gender: import("@/lib/avatars").GenderId;
};

export default function ProfileHeader({
  user,
  username,
  balance,
  level,
  currentXp,
  xpToNext,
  avatarLetter,
  avatarUrl,
  selectedSkinId,
  gender,
}: ProfileHeaderProps) {
  return (
    <header className="witcher-header relative z-40 w-full shrink-0">
      <div className="flex h-14 w-full items-stretch gap-2 px-3 md:h-[72px] md:gap-4 md:px-5">
        <Link
          href="/"
          className="flex min-w-0 flex-1 items-center justify-start transition-opacity hover:opacity-80"
          aria-label="Мастер меча — главная"
        >
          <AppLogo size={28} className="md:hidden" />
          <AppLogo size={36} className="hidden md:block" />
        </Link>

        <WitcherNav />

        <div className="flex min-w-0 flex-1 items-center justify-end">
          <ProfileTrigger
            user={user}
            username={username}
            balance={balance}
            level={level}
            currentXp={currentXp}
            xpToNext={xpToNext}
            avatarLetter={avatarLetter}
            avatarUrl={avatarUrl}
            selectedSkinId={selectedSkinId}
            gender={gender}
          />
        </div>
      </div>
    </header>
  );
}
