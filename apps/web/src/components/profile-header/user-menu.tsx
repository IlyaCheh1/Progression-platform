"use client";

import { usePathname, useRouter } from "next/navigation";
import CharacterAvatar from "@/components/character-avatar";
import {
  IconProfileAdmin,
  IconProfileCabinet,
  IconProfileLogout,
  IconProfilePeople,
  IconProfileSettings,
  IconProfileStudio,
} from "@/components/profile-header/profile-menu-icons";
import { getRoleCabinetMenuItems } from "@/lib/profile-menu";
import { routes } from "@/lib/routes";
import { clearSession, type SessionUser } from "@/lib/session";
import type { GenderId } from "@/lib/avatars";
import type { OgCharacterId } from "@/lib/characters";
import { cn } from "@/lib/utils";
import type { ComponentType, SVGProps } from "react";

type UserMenuProps = {
  user: SessionUser;
  username: string;
  selectedSkinId: OgCharacterId;
  gender: GenderId;
  avatarUrl?: string;
  onClose: () => void;
};

type MenuIcon = ComponentType<SVGProps<SVGSVGElement>>;

const BASE_ITEMS = [
  {
    id: "profile-settings",
    label: "Настройки профиля",
    href: `${routes.settings}?tab=personal`,
    Icon: IconProfileSettings,
  },
] as const;

function iconForRoleItem(id: string): MenuIcon {
  if (id === "cabinet-administrator") return IconProfileAdmin;
  if (id === "studio") return IconProfileStudio;
  return IconProfileCabinet;
}

export default function UserMenu({
  user,
  username,
  selectedSkinId,
  gender,
  avatarUrl,
  onClose,
}: UserMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const roleItems = getRoleCabinetMenuItems(user.roles);

  function navigate(href: string) {
    onClose();
    router.push(href);
  }

  function switchAccount() {
    onClose();
    clearSession();
    const returnUrl = pathname && pathname.startsWith("/") ? pathname : "/";
    const params = new URLSearchParams({
      prompt: "select_account",
      returnUrl,
    });
    window.location.assign(`/api/auth/login?${params.toString()}`);
  }

  async function logout() {
    onClose();
    clearSession();
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        const data = (await res.json()) as { ssoLogoutUrl?: string | null };
        if (data.ssoLogoutUrl) {
          window.location.assign(data.ssoLogoutUrl);
          return;
        }
      }
    } catch {
      // Fall through to local logout.
    }
    router.push("/");
  }

  return (
    <div className="min-w-[220px] rounded-2xl bg-[var(--color-tertiaryBg)] p-4 shadow-2xl md:min-w-[290px] md:rounded-[32px] md:p-6">
      <div className="flex flex-col items-center gap-2 md:gap-4">
        <CharacterAvatar
          selectedSkinId={selectedSkinId}
          gender={gender}
          imageSrc={avatarUrl}
          fallbackLetter={username}
          variant="head"
          className="h-16 w-16 rounded-2xl md:h-20 md:w-20"
        />
        <h3 className="font-unbounded text-sm font-medium leading-4 text-primaryText md:text-base md:leading-6">
          {username}
        </h3>
      </div>

      <div className="mt-3 flex flex-col gap-2 md:mt-4 md:gap-4">
        {BASE_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className="group flex w-full items-center gap-2 md:gap-3"
            onClick={() => navigate(item.href)}
          >
            <item.Icon className="h-5 w-5 text-mos-muted transition-colors duration-100 group-hover:text-mos-amber md:h-6 md:w-6" />
            <span className="font-golos text-xs font-normal leading-4 text-primaryText transition-colors duration-100 group-hover:text-mos-amber md:text-sm md:leading-5">
              {item.label}
            </span>
          </button>
        ))}

        {roleItems.map((item) => {
          const Icon = iconForRoleItem(item.id);
          return (
            <button
              key={item.id}
              type="button"
              className="group flex w-full items-center gap-2 md:gap-3"
              onClick={() => navigate(item.href)}
            >
              <Icon className="h-5 w-5 text-mos-muted transition-colors duration-100 group-hover:text-mos-amber md:h-6 md:w-6" />
              <span
                className={cn(
                  "font-golos text-xs font-normal leading-4 transition-colors duration-100 md:text-sm md:leading-5",
                  item.highlight
                    ? "bg-gradient-premium bg-clip-text font-medium text-transparent"
                    : "text-primaryText group-hover:text-mos-amber",
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="my-3 h-px bg-[var(--color-strokeBg)] md:my-4" />

      <div className="flex flex-col gap-2 md:gap-4">
        <button type="button" className="group flex w-full items-center gap-2 md:gap-3" onClick={switchAccount}>
          <IconProfilePeople className="h-5 w-5 text-mos-muted transition-colors duration-100 group-hover:text-mos-amber md:h-6 md:w-6" />
          <span className="font-golos text-xs font-normal leading-4 text-primaryText transition-colors duration-100 group-hover:text-mos-amber md:text-sm md:leading-5">
            Сменить аккаунт
          </span>
        </button>

        <button type="button" className="group flex w-full items-center gap-2 md:gap-3" onClick={logout}>
          <IconProfileLogout className="h-5 w-5 text-mos-muted transition-colors duration-100 group-hover:text-primaryText md:h-6 md:w-6" />
          <span className="font-golos text-xs font-normal leading-4 text-secondaryText transition-colors duration-100 group-hover:text-primaryText md:text-sm md:leading-5">
            Выход
          </span>
        </button>
      </div>
    </div>
  );
}
