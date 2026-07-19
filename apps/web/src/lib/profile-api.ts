import { SCHOOL_API, schoolApiUnavailableMessage } from "@/lib/utils";
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
  avatarUrl: string;
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
  avatarUrl?: string | null;
  profileComplete?: boolean;
};

export const PROFILE_CHANGED_EVENT = "mos:profile-changed";

export class ProfileApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ProfileApiError";
    this.status = status;
    this.code = code;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }
}

const PROFILE_ERROR_MESSAGES: Record<string, string> = {
  unauthorized: "Сессия истекла. Войдите снова.",
  invalid_character: "Выбранный персонаж недоступен. Выберите другого.",
  invalid_skin: "Выбранный персонаж недоступен. Выберите другого.",
  invalid_gender: "Некорректный пол персонажа.",
  invalid_background: "Выбранный фон недоступен.",
  character_not_owned: "Этот образ ещё не открыт.",
  background_not_owned: "Этот фон ещё не открыт.",
  invalid_avatar: "Некорректный формат аватара. Загрузите JPEG, PNG или WebP.",
  avatar_too_large: "Аватар слишком большой (макс. 2 МБ).",
  avatar_presign_failed: "Не удалось получить ссылку для загрузки аватара.",
  avatar_upload_failed: "Не удалось подтвердить загрузку аватара.",
  avatar_upload_expired: "Сессия загрузки истекла. Выберите файл ещё раз.",
  avatar_key_mismatch: "Ошибка загрузки аватара. Попробуйте снова.",
  storage_unavailable: "Хранилище аватаров недоступно. Проверьте настройки S3 на сервере.",
  bad_request: "Некорректные данные профиля.",
  "student not found": "Профиль не найден. Войдите снова.",
};

export class PresignAvatarError extends ProfileApiError {
  constructor(status: number, code: string, message: string) {
    super(status, code, message);
    this.name = "PresignAvatarError";
  }
}

export function messageForProfileError(error: unknown): string {
  if (error instanceof ProfileApiError) {
    return PROFILE_ERROR_MESSAGES[error.code] ?? error.message;
  }
  if (error instanceof TypeError) {
    return schoolApiUnavailableMessage();
  }
  return schoolApiUnavailableMessage();
}

async function readApiError(res: Response, fallbackCode: string): Promise<ProfileApiError> {
  let code = fallbackCode;
  try {
    const data = (await res.json()) as { error?: unknown };
    if (typeof data.error === "string" && data.error.trim()) {
      code = data.error.trim();
    }
  } catch {
    // non-JSON body
  }
  const message = PROFILE_ERROR_MESSAGES[code] ?? `Ошибка сохранения профиля (${res.status}).`;
  return new ProfileApiError(res.status, code, message);
}

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

function notifyProfileChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PROFILE_CHANGED_EVENT));
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
  if (profile.avatarUrl) {
    localStorage.setItem("mos.avatarUrl", profile.avatarUrl);
  } else {
    localStorage.removeItem("mos.avatarUrl");
  }
  notifyProfileChanged();
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
  localStorage.removeItem("mos.avatarUrl");
  notifyProfileChanged();
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
    avatarUrl: typeof data.avatarUrl === "string" ? data.avatarUrl : "",
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
  let res: Response;
  try {
    res = await fetch(`${SCHOOL_API}/v1/profile/me`, {
      method: "PUT",
      headers: authHeaders(session),
      body: JSON.stringify({
        username: input.username,
        selectedSkinId: input.selectedSkinId,
        gender: input.gender,
        backgroundKey: input.backgroundKey ?? DEFAULT_BACKGROUND_ID,
        avatarUrl: input.avatarUrl === undefined ? undefined : (input.avatarUrl ?? ""),
        profileComplete: input.profileComplete ?? true,
      }),
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new ProfileApiError(0, "network", schoolApiUnavailableMessage());
    }
    throw error;
  }
  if (!res.ok) {
    throw await readApiError(res, res.status === 401 ? "unauthorized" : "profile_save_failed");
  }
  const data = (await res.json()) as Record<string, unknown>;
  const profile = normalizeProfile(data);
  writeCachedProfile(profile);
  return profile;
}

export type AvatarPresignResponse = {
  uploadUrl: string;
  fileId: string;
  key: string;
};

export async function presignAvatarUpload(
  session: SessionUser,
  input: { filename: string; mimeType: string; fileSize: number },
): Promise<AvatarPresignResponse> {
  let res: Response;
  try {
    res = await fetch(`${SCHOOL_API}/v1/profile/avatar/presign`, {
      method: "POST",
      headers: authHeaders(session),
      body: JSON.stringify({
        filename: input.filename,
        mimeType: input.mimeType,
        fileSize: String(input.fileSize),
      }),
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new PresignAvatarError(0, "network", schoolApiUnavailableMessage());
    }
    throw error;
  }
  if (!res.ok) {
    const apiError = await readApiError(res, res.status === 503 ? "storage_unavailable" : "avatar_presign_failed");
    throw new PresignAvatarError(apiError.status, apiError.code, apiError.message);
  }
  const data = (await res.json()) as Record<string, unknown>;
  const uploadUrl = typeof data.uploadUrl === "string" ? data.uploadUrl : "";
  const fileId = typeof data.fileId === "string" ? data.fileId : "";
  const key = typeof data.key === "string" ? data.key : "";
  if (!uploadUrl || !fileId || !key) {
    throw new PresignAvatarError(502, "avatar_presign_failed", PROFILE_ERROR_MESSAGES.avatar_presign_failed);
  }
  return { uploadUrl, fileId, key };
}

export async function confirmAvatarUpload(
  session: SessionUser,
  input: { fileId: string; key?: string },
): Promise<PlayerProfile> {
  let res: Response;
  try {
    res = await fetch(`${SCHOOL_API}/v1/profile/avatar/confirm`, {
      method: "POST",
      headers: authHeaders(session),
      body: JSON.stringify({
        fileId: input.fileId,
        key: input.key,
      }),
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new ProfileApiError(0, "network", schoolApiUnavailableMessage());
    }
    throw error;
  }
  if (!res.ok) {
    throw await readApiError(res, "avatar_upload_failed");
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
