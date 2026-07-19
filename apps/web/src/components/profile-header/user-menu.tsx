"use client";

import Link from "next/link";
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
  avatarLetter: string;
  selectedSkinId: OgCharacterId;
  gender: GenderId;
  onClose: () => void;
};

const BASE_ITEMS = [
  { id: "profile-settings", label: "Настройки профиля", href: routes.settings, Icon: IconProfileSettings },
] as const;

export default function UserMenu({ user, selectedSkinId, gender, onClose }: UserMenuProps) {
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
    <div className="og-panel min-w-[220px] p-4 shadow-2xl md:min-w-[290px] md:p-6">
      <div className="flex flex-col items-center gap-3">
        <CharacterAvatar
          selectedSkinId={selectedSkinId}
          gender={gender}
          variant="head"
          className="h-16 w-16 rounded-2xl md:h-20 md:w-20"
        />
        <h3 className="font-display text-base text-mos-text md:text-lg">{user.name || user.login}</h3>
        <p className="text-xs text-mos-muted">{user.login}</p>
      </div>

      <div className="mt-4 flex flex-col gap-1">
        {BASE_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className="og-menu-item group"
            onClick={() => navigate(item.href)}
          >
            <span className="og-menu-item-icon">
              <item.Icon className="h-4 w-4 md:h-5 md:w-5" />
            </span>
            <span className="transition-colors">{item.label}</span>
          </button>
        ))}
      </div>

      {roleItems.length > 0 && (
        <>
          <div className="og-menu-divider" />
          <div className="flex flex-col gap-1">
            {roleItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className="og-menu-item group"
                onClick={() => navigate(item.href)}
              >
                <span className="og-menu-item-icon">
                  <IconProfileCabinet className="h-4 w-4 md:h-5 md:w-5" />
                </span>
                <span
                  className={cn(
                    "transition-colors",
                    item.highlight ? "font-medium text-mos-amber" : "text-mos-text group-hover:text-mos-amber",
                  )}
                >
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      <div className="og-menu-divider" />

      <button type="button" className="og-menu-item group" onClick={logout}>
        <span className="og-menu-item-icon">
          <IconProfileLogout className="h-4 w-4 md:h-5 md:w-5" />
        </span>
        <span className="text-mos-muted transition-colors group-hover:text-mos-text">Выход</span>
      </button>

      <p className="mt-4 text-center text-[10px] text-mos-muted/70">
        <Link href={routes.home} className="hover:text-mos-amber" onClick={onClose}>
          Вернуться в профиль
        </Link>
      </p>
    </div>
  );
}
