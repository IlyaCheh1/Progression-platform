"use client";

import { useEffect, useState } from "react";
import type { PlayerProfile } from "@/lib/profile-api";
import type { GenderId } from "@/lib/avatars";
import { characterInitial } from "@/lib/characters";
import type { OgCharacterId } from "@/lib/characters";
import { readCapsBalance } from "@/lib/caps";
import { profileDisplayName } from "@/lib/profile-menu";
import type { SessionUser } from "@/lib/session";

const XP_FALLBACK = 500;

type ShellData = {
  username: string;
  balance: number;
  level: number;
  currentXp: number;
  xpToNext: number;
  avatarLetter: string;
  avatarUrl: string;
  selectedSkinId: OgCharacterId;
  gender: GenderId;
};

const EMPTY_SHELL: ShellData = {
  username: "",
  balance: 0,
  level: 1,
  currentXp: 0,
  xpToNext: XP_FALLBACK,
  avatarLetter: "У",
  avatarUrl: "",
  selectedSkinId: "3",
  gender: "MALE",
};

export function useProfileShellData(user: SessionUser | null, profile?: PlayerProfile | null): ShellData {
  const [data, setData] = useState<ShellData>(EMPTY_SHELL);

  useEffect(() => {
    if (!user) {
      setData(EMPTY_SHELL);
      return;
    }

    const gender: GenderId = profile?.gender ?? "MALE";
    const selectedSkinId = profile?.selectedSkinId ?? "3";
    const balance = typeof window !== "undefined" ? readCapsBalance() : 0;

    setData({
      username: profileDisplayName(profile, user),
      balance,
      level: profile?.level ?? 1,
      currentXp: profile?.xp ?? 0,
      xpToNext: profile?.xpToNextLevel ?? XP_FALLBACK,
      avatarLetter: (profileDisplayName(profile, user)[0] || characterInitial(selectedSkinId, gender)).toUpperCase(),
      avatarUrl: profile?.avatarUrl ?? "",
      selectedSkinId,
      gender,
    });
  }, [profile, user]);

  return data;
}
