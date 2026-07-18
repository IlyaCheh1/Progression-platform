export type SessionUser = {
  studentId: string;
  name: string;
  login: string;
  characterId: string;
  accessToken: string;
};

const KEY = "mos.session";

export function saveSession(user: SessionUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(user));
}

export function loadSession(): SessionUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

export function hasProfile(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("mos.profile") === "1";
}

export function markProfileCreated() {
  localStorage.setItem("mos.profile", "1");
}
