"use client";

import { useEffect, useState } from "react";
import type { PlayerProfile } from "@/lib/profile-api";
import type { GenderId } from "@/lib/avatars";
import { characterInitial } from "@/lib/characters";
import type { OgCharacterId } from "@/lib/characters";
import type { SessionUser } from "@/lib/session";

const XP_FALLBACK = 500;

type ShellData = {
  username: string;
  balance: number;
  level: number;
  currentXp: number;
  xpToNext: number;
  avatarLetter: string;
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
    const balance = typeof window !== "undefined" ? Number(localStorage.getItem("mos.caps") ?? "0") : 0;

    setData({
      username: profile?.username || user.name || user.login,
      balance,
      level: profile?.level ?? 1,
      currentXp: profile?.xp ?? 0,
      xpToNext: profile?.xpToNextLevel ?? XP_FALLBACK,
      avatarLetter: characterInitial(selectedSkinId, gender),
      selectedSkinId,
      gender,
    });
  }, [profile, user]);

  return data;
}
