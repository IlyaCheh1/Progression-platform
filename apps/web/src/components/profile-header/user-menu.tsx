"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import CharacterAvatar from "@/components/character-avatar";
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
  { id: "profile-settings", label: "Настройки профиля", href: routes.settings, icon: "⚙" },
] as const;

export default function UserMenu({ user, avatarLetter, selectedSkinId, gender, onClose }: UserMenuProps) {
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
    <div className="min-w-[220px] rounded-2xl border border-mos-line/50 bg-mos-stone p-4 shadow-2xl md:min-w-[290px] md:rounded-[32px] md:p-6">
      <div className="flex flex-col items-center gap-3">
        <CharacterAvatar selectedSkinId={selectedSkinId} gender={gender} variant="head" className="h-16 w-16 md:h-20 md:w-20" />
        <h3 className="font-display text-base text-mos-text md:text-lg">{user.name || user.login}</h3>
        <p className="text-xs text-mos-muted">{user.login}</p>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {BASE_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className="group flex w-full items-center gap-3 text-left"
            onClick={() => navigate(item.href)}
          >
            <span className="text-lg text-mos-muted transition-colors group-hover:text-mos-amber">{item.icon}</span>
            <span className="text-sm text-mos-text transition-colors group-hover:text-mos-amber">{item.label}</span>
          </button>
        ))}
      </div>

      {roleItems.length > 0 && (
        <>
          <div className="my-4 h-px bg-mos-line/40" />
          <div className="flex flex-col gap-3">
            {roleItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className="group flex w-full items-center gap-3 text-left"
                onClick={() => navigate(item.href)}
              >
                <span className="text-lg text-mos-muted transition-colors group-hover:text-mos-amber">◈</span>
                <span
                  className={cn(
                    "text-sm transition-colors group-hover:text-mos-amber",
                    item.highlight ? "font-medium text-mos-amber" : "text-mos-text",
                  )}
                >
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      <div className="my-4 h-px bg-mos-line/40" />

      <button
        type="button"
        className="group flex w-full items-center gap-3 text-left"
        onClick={logout}
      >
        <span className="text-lg text-mos-muted transition-colors group-hover:text-mos-text">↪</span>
        <span className="text-sm text-mos-muted transition-colors group-hover:text-mos-text">Выход</span>
      </button>

      <p className="mt-4 text-center text-[10px] text-mos-muted/70">
        <Link href={routes.home} className="hover:text-mos-amber" onClick={onClose}>
          Вернуться в профиль
        </Link>
      </p>
    </div>
  );
}
