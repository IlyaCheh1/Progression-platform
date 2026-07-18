export type UserRole = "student" | "platform_admin";

export type SessionUser = {
  studentId: string;
  name: string;
  login: string;
  characterId: string;
  accessToken: string;
  role: UserRole;
};

const KEY = "mos.session";

export function isPlatformAdmin(user: SessionUser | null | undefined): boolean {
  return user?.role === "platform_admin";
}

export function saveSession(user: SessionUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(user));
}

export function loadSession(): SessionUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<SessionUser>;
    if (!parsed.studentId || !parsed.accessToken) return null;
    return {
      studentId: parsed.studentId,
      name: parsed.name ?? "",
      login: parsed.login ?? "",
      characterId: parsed.characterId ?? "",
      accessToken: parsed.accessToken,
      role: parsed.role === "platform_admin" ? "platform_admin" : "student",
    };
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

export function authHeaders(user: SessionUser): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user.accessToken}`,
  };
}
