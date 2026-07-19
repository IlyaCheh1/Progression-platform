import { SCHOOL_API } from "@/lib/utils";
import type { GenderId } from "@/lib/avatars";
import { DEFAULT_BACKGROUND_ID, normalizeBackgroundId } from "@/lib/backgrounds";
import { normalizeSelectedSkinId, type OgCharacterId } from "@/lib/characters";
import { authHeaders, type SessionUser } from "@/lib/session";

export type PlayerProfile = {
  studentId: string;
  characterId: string;
  displayName: string;
  profileComplete: boolean;
  username: string;
  selectedSkinId: OgCharacterId;
  gender: GenderId;
  backgroundKey: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  mastery: Record<string, number>;
  ranks: Record<string, number>;
};

export type SaveProfileInput = {
  username: string;
  selectedSkinId: OgCharacterId;
  gender: GenderId;
  backgroundKey?: string;
  profileComplete?: boolean;
};

const CACHE_KEY = "mos.player-profile";

export function readCachedProfile(): PlayerProfile | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(CACHE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PlayerProfile;
  } catch {
    return null;
  }
}

export function writeCachedProfile(profile: PlayerProfile) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CACHE_KEY, JSON.stringify(profile));
  localStorage.setItem("mos.profile", profile.profileComplete ? "1" : "0");
  localStorage.setItem("mos.username", profile.username);
  localStorage.setItem("mos.selectedSkinId", profile.selectedSkinId);
  localStorage.setItem("mos.gender", profile.gender);
  if (profile.backgroundKey) {
    localStorage.setItem("mos.background", profile.backgroundKey);
  }
}

export function clearCachedProfile() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem("mos.profile");
  localStorage.removeItem("mos.username");
  localStorage.removeItem("mos.selectedSkinId");
  localStorage.removeItem("mos.skin");
  localStorage.removeItem("mos.gender");
  localStorage.removeItem("mos.background");
}

function normalizeProfile(data: Record<string, unknown>): PlayerProfile {
  const gender = (data.gender === "FEMALE" ? "FEMALE" : "MALE") as GenderId;
  const selectedSkinId = normalizeSelectedSkinId(
    String(data.selectedSkinId ?? data.skin ?? ""),
    gender,
  );

  return {
    studentId: String(data.studentId ?? ""),
    characterId: String(data.characterId ?? ""),
    displayName: String(data.displayName ?? ""),
    profileComplete: Boolean(data.profileComplete),
    username: String(data.username ?? data.displayName ?? ""),
    selectedSkinId,
    gender,
    backgroundKey: normalizeBackgroundId(String(data.backgroundKey ?? DEFAULT_BACKGROUND_ID)),
    level: Number(data.level ?? 1),
    xp: Number(data.xp ?? 0),
    xpToNextLevel: Number(data.xpToNextLevel ?? 500),
    mastery: (data.mastery as Record<string, number>) ?? {},
    ranks: (data.ranks as Record<string, number>) ?? {},
  };
}

export async function fetchMyProfile(session: SessionUser): Promise<PlayerProfile | null> {
  const res = await fetch(`${SCHOOL_API}/v1/profile/me`, { headers: authHeaders(session) });
  if (!res.ok) return null;
  const data = (await res.json()) as Record<string, unknown>;
  const profile = normalizeProfile(data);
  writeCachedProfile(profile);
  return profile;
}

export async function saveMyProfile(session: SessionUser, input: SaveProfileInput): Promise<PlayerProfile> {
  const res = await fetch(`${SCHOOL_API}/v1/profile/me`, {
    method: "PUT",
    headers: authHeaders(session),
    body: JSON.stringify({
      username: input.username,
      selectedSkinId: input.selectedSkinId,
      gender: input.gender,
      backgroundKey: input.backgroundKey ?? DEFAULT_BACKGROUND_ID,
      profileComplete: input.profileComplete ?? true,
    }),
  });
  if (!res.ok) {
    throw new Error("profile_save_failed");
  }
  const data = (await res.json()) as Record<string, unknown>;
  const profile = normalizeProfile(data);
  writeCachedProfile(profile);
  return profile;
}

export async function migrateLocalProfileToBackend(session: SessionUser): Promise<PlayerProfile | null> {
  if (typeof window === "undefined") return null;
  const hasLocal = localStorage.getItem("mos.profile") === "1";
  if (!hasLocal) return null;

  const remote = await fetchMyProfile(session);
  if (remote?.profileComplete) return remote;

  const username = localStorage.getItem("mos.username") ?? session.name;
  const gender = (localStorage.getItem("mos.gender") === "FEMALE" ? "FEMALE" : "MALE") as GenderId;
  const legacySkin = localStorage.getItem("mos.selectedSkinId") ?? localStorage.getItem("mos.skin") ?? "";
  const selectedSkinId = normalizeSelectedSkinId(legacySkin, gender);
  const backgroundKey = localStorage.getItem("mos.background") ?? DEFAULT_BACKGROUND_ID;

  try {
    return await saveMyProfile(session, { username, selectedSkinId, gender, backgroundKey, profileComplete: true });
  } catch {
    return remote;
  }
}
