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
  selectedSkinId,
  gender,
}: ProfileHeaderProps) {
  return (
    <header className="witcher-header relative z-40">
      <div className="mx-auto flex h-14 max-w-[1400px] items-stretch gap-2 px-2 md:h-[72px] md:gap-4 md:px-6">
        <Link
          href="/profile"
          className="flex flex-1 items-center transition-opacity hover:opacity-80"
          aria-label="Мастер меча — профиль"
        >
          <AppLogo size={28} className="md:hidden" />
          <AppLogo size={36} className="hidden md:block" />
        </Link>

        <WitcherNav />

        <div className="ml-auto flex flex-1 items-center justify-end">
          <ProfileTrigger
            user={user}
            username={username}
            balance={balance}
            level={level}
            currentXp={currentXp}
            xpToNext={xpToNext}
            avatarLetter={avatarLetter}
            selectedSkinId={selectedSkinId}
            gender={gender}
          />
        </div>
      </div>
    </header>
  );
}
