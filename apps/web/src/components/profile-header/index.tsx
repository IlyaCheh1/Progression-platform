"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import AppLogo from "@/components/app-logo";
import PopupMenu from "@/components/ui/popup-menu";
import ProfileTrigger from "@/components/profile-header/profile-trigger";
import SchoolsMenu from "@/components/profile-header/schools-menu";
import { profileNavItems } from "@/lib/routes";
import type { SessionUser } from "@/lib/session";
import { cn } from "@/lib/utils";

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

const TAB_CLIP = "polygon(25px 0, 100% 0, calc(100% - 25px) 100%, 0 100%)";

function HeaderTab({
  item,
  active,
  isLast,
}: {
  item: (typeof profileNavItems)[number];
  active: boolean;
  isLast: boolean;
}) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const button = (
    <button
      type="button"
      className={cn(
        "relative flex h-full w-[88px] items-center justify-center overflow-hidden backdrop-blur-md transition-all md:w-40",
        "border-y border-mos-line/30 bg-mos-stone/40",
        isLast && "border-r border-mos-line/30",
        item.inDevelopment && "cursor-not-allowed opacity-80",
      )}
      style={{ clipPath: TAB_CLIP }}
      onClick={() => {
        if (item.dropdown || item.inDevelopment) return;
        router.push(item.href);
      }}
    >
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-b from-mos-amber/25 to-transparent transition-opacity",
          active ? "opacity-100" : "opacity-0 group-hover:opacity-40",
        )}
        style={{ clipPath: TAB_CLIP }}
      />
      <span className="relative z-10 inline-flex flex-col items-center gap-0 px-1 text-[7px] font-medium uppercase tracking-[0.6px] text-mos-text md:text-xs">
        <span>{item.label}</span>
        {item.inDevelopment && (
          <span className="text-[6px] font-normal normal-case text-mos-muted md:text-[10px]">В разработке</span>
        )}
        {item.dropdown && (
          <span className={cn("text-[8px] transition-transform md:text-[10px]", isMenuOpen && "rotate-180")}>▼</span>
        )}
      </span>
    </button>
  );

  if (item.dropdown) {
    return (
      <div className="group relative h-full">
        <PopupMenu
          trigger={button}
          placement="bottom-right"
          isOpen={isMenuOpen}
          onOpenChange={setIsMenuOpen}
        >
          <SchoolsMenu />
        </PopupMenu>
      </div>
    );
  }

  return <div className="group relative h-full">{button}</div>;
}

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
  const pathname = usePathname();
  const activeTab = profileNavItems.find((item) => item.href === pathname)?.id;

  return (
    <header className="relative z-40 border-b border-mos-line/50 bg-mos-bg/90 backdrop-blur">
      <div className="mx-auto flex h-12 max-w-6xl items-stretch gap-2 px-2 md:h-[60px] md:gap-3 md:px-4">
        <Link
          href="/profile"
          className="flex flex-1 items-center transition-opacity hover:opacity-80"
          aria-label="Мастер меча — профиль"
        >
          <AppLogo size={28} className="md:hidden" />
          <AppLogo size={36} className="hidden md:block" />
        </Link>

        <nav className="mx-auto flex h-full items-stretch">
          {profileNavItems.map((item, index) => (
            <div
              key={item.id}
              className="h-full"
              style={{ marginLeft: index !== 0 ? -20 : undefined }}
            >
              <HeaderTab item={item} active={activeTab === item.id} isLast={index === profileNavItems.length - 1} />
            </div>
          ))}
        </nav>

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
