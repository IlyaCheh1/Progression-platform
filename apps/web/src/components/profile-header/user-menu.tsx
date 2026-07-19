"use client";

import { useRouter } from "next/navigation";
import CharacterAvatar from "@/components/character-avatar";
import {
  IconProfileCabinet,
  IconProfileLogout,
  IconProfileSettings,
} from "@/components/profile-header/profile-menu-icons";
import { getRoleCabinetMenuItems } from "@/lib/profile-menu";
import { routes } from "@/lib/routes";
import { clearSession, type SessionUser } from "@/lib/session";
import type { GenderId } from "@/lib/avatars";
import type { OgCharacterId } from "@/lib/characters";
import { cn } from "@/lib/utils";

type UserMenuProps = {
  user: SessionUser;
  username: string;
  selectedSkinId: OgCharacterId;
  gender: GenderId;
  onClose: () => void;
};

const BASE_ITEMS = [
  {
    id: "profile-settings",
    label: "Настройки профиля",
    href: `${routes.settings}?tab=personal`,
    Icon: IconProfileSettings,
  },
] as const;

export default function UserMenu({
  user,
  username,
  selectedSkinId,
  gender,
  onClose,
}: UserMenuProps) {
  const router = useRouter();
  const roleItems = getRoleCabinetMenuItems(user.roles);

  function navigate(href: string) {
    onClose();
    router.push(href);
  }

  function logout() {
    onClose();
    clearSession();
    router.push("/");
  }

  return (
    <div className="min-w-[220px] rounded-2xl bg-[var(--color-tertiaryBg)] p-4 shadow-2xl md:min-w-[290px] md:rounded-[32px] md:p-6">
      <div className="flex flex-col items-center gap-2 md:gap-4">
        <CharacterAvatar
          selectedSkinId={selectedSkinId}
          gender={gender}
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
      </div>

      {roleItems.length > 0 && (
        <>
          <div className="my-3 h-px bg-[var(--color-strokeBg)] md:my-4" />
          <div className="flex flex-col gap-2 md:gap-4">
            {roleItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className="group flex w-full items-center gap-2 md:gap-3"
                onClick={() => navigate(item.href)}
              >
                <IconProfileCabinet className="h-5 w-5 text-mos-muted transition-colors duration-100 group-hover:text-mos-amber md:h-6 md:w-6" />
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
            ))}
          </div>
        </>
      )}

      <div className="my-3 h-px bg-[var(--color-strokeBg)] md:my-4" />

      <button type="button" className="group flex w-full items-center gap-2 md:gap-3" onClick={logout}>
        <IconProfileLogout className="h-5 w-5 text-mos-muted transition-colors duration-100 group-hover:text-primaryText md:h-6 md:w-6" />
        <span className="font-golos text-xs font-normal leading-4 text-secondaryText transition-colors duration-100 group-hover:text-primaryText md:text-sm md:leading-5">
          Выход
        </span>
      </button>
    </div>
  );
}
