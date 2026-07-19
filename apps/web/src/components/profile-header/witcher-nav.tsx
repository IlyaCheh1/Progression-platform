"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import PopupMenu from "@/components/ui/popup-menu";
import SchoolsMenu from "@/components/profile-header/schools-menu";
import {
  IconAchievements,
  IconDirectionDown,
  IconInventory,
  IconProfile,
  IconSchools,
  IconStore,
  IconTalents,
} from "@/components/profile-header/nav-icons";
import { profileNavItems, type ProfileNavItem } from "@/lib/routes";
import { cn } from "@/lib/utils";

const NAV_ICONS: Record<string, (props: { className?: string }) => ReactNode> = {
  home: (p) => <IconProfile className={p.className} />,
  inventory: (p) => <IconInventory className={p.className} />,
  achievements: (p) => <IconAchievements className={p.className} />,
  talents: (p) => <IconTalents className={p.className} />,
  store: (p) => <IconStore className={p.className} />,
  schools: (p) => <IconSchools className={p.className} />,
};

function WitcherTab({
  item,
  active,
}: {
  item: ProfileNavItem;
  active: boolean;
}) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const Icon = NAV_ICONS[item.id];

  const button = (
    <button
      type="button"
      aria-current={active ? "page" : undefined}
      aria-disabled={item.inDevelopment || undefined}
      className={cn(
        "witcher-nav-item group relative flex h-full min-w-[64px] flex-col items-center justify-center gap-0.5 px-2 transition-colors duration-300 md:min-w-[88px] md:gap-1 md:px-3",
        item.dropdown && "min-w-[72px] overflow-visible md:min-w-[96px]",
        item.inDevelopment && "cursor-not-allowed",
        active ? "text-mos-amber" : "text-[#9a9690]/hover:text-[#c8c6c2]",
      )}
      onClick={() => {
        if (item.dropdown || item.inDevelopment) return;
        router.push(item.href);
      }}
    >
      {/* Vertical gold glow behind active item */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-1 top-0 bottom-2 bg-[radial-gradient(ellipse_55%_85%_at_50%_35%,rgba(229,176,66,0.35)_0%,rgba(229,176,66,0.08)_45%,transparent_72%)] transition-opacity duration-300 md:inset-x-2",
          active ? "opacity-100" : "opacity-0 group-hover:opacity-30",
        )}
      />

      <span
        className={cn(
          "relative z-10 transition-[filter,opacity,color] duration-300",
          active
            ? "opacity-100 drop-shadow-[0_0_8px_rgba(229,176,66,0.55)]"
            : "opacity-70 group-hover:opacity-90",
        )}
      >
        {Icon ? <Icon className="h-6 w-6 md:h-7 md:w-7" /> : null}
      </span>

      <span
        className={cn(
          "relative z-10 inline-flex flex-col items-center font-display text-[7px] font-medium uppercase tracking-[0.14em] transition-[filter,opacity,color] duration-300 md:text-[10px] md:tracking-[0.18em]",
          active
            ? "opacity-100 drop-shadow-[0_0_6px_rgba(229,176,66,0.45)]"
            : "opacity-70 group-hover:opacity-90",
        )}
      >
        {/* Label alone defines centering; chevron is absolute so it does not shift the icon */}
        <span className="relative inline-block">
          {item.label}
          {item.dropdown ? (
            <IconDirectionDown
              className={cn(
                "absolute left-[calc(100%+2px)] top-1/2 h-3 w-3 -translate-y-1/2 transition-transform duration-200 md:h-4 md:w-4",
                isMenuOpen && "rotate-180",
              )}
            />
          ) : null}
        </span>
        {item.inDevelopment ? (
          <span className="mt-0.5 block text-[6px] font-normal normal-case tracking-normal text-mos-muted md:text-[8px]">
            В разработке
          </span>
        ) : null}
      </span>

      {/* Upward triangle on the separator line */}
      <span
        aria-hidden
        className={cn(
          "absolute bottom-0 left-1/2 z-20 h-0 w-0 -translate-x-1/2 translate-y-[1px] border-x-[5px] border-b-[6px] border-x-transparent border-b-[#e5b042] transition-opacity duration-300 md:border-x-[6px] md:border-b-[7px]",
          active ? "opacity-100" : "opacity-0",
        )}
      />

      {/* Gold segment of the bottom metallic line */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-x-2 bottom-0 z-10 h-px bg-[#e5b042] shadow-[0_0_8px_rgba(229,176,66,0.75)] transition-opacity duration-300 md:inset-x-4",
          active ? "opacity-100" : "opacity-0",
        )}
      />
    </button>
  );

  if (item.dropdown) {
    return (
      <PopupMenu
        trigger={button}
        placement="bottom-right"
        isOpen={isMenuOpen}
        onOpenChange={setIsMenuOpen}
      >
        <SchoolsMenu />
      </PopupMenu>
    );
  }

  return button;
}

export default function WitcherNav() {
  const pathname = usePathname();
  const activeTab = profileNavItems.find((item) => item.href === pathname)?.id;

  return (
    <nav
      className="witcher-nav relative mx-auto flex h-full items-stretch justify-center"
      aria-label="Навигация профиля"
    >
      {profileNavItems.map((item) => (
        <WitcherTab key={item.id} item={item} active={activeTab === item.id} />
      ))}
    </nav>
  );
}
