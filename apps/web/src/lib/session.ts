import {
  canManageUsers,
  hasPermissionForRoles,
  hasRole,
  homePathForRoles,
  isAdminPrincipal,
  normalizeRole,
  normalizeRoles,
  primaryRole,
  type Permission,
  type UserRole,
} from "@/lib/rbac";

export type { Permission, UserRole };

export type SessionUser = {
  studentId: string;
  name: string;
  login: string;
  characterId: string;
  accessToken: string;
  role: UserRole;
  roles: UserRole[];
  profileComplete?: boolean;
};

const KEY = "mos.session";
const PROFILE_CACHE_KEY = "mos.player-profile";
export const SESSION_CHANGED_EVENT = "mos:session-changed";

function notifySessionChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SESSION_CHANGED_EVENT));
}

export { canManageUsers, homePathForRoles, isAdminPrincipal, normalizeRole, normalizeRoles, primaryRole };

export function hasPermission(user: SessionUser | null | undefined, permission: Permission): boolean {
  if (!user) return false;
  return hasPermissionForRoles(user.roles, permission);
}

export { hasRole };

/** @deprecated use isAdminPrincipal with roles */
export function isPlatformAdmin(user: SessionUser | null | undefined): boolean {
  return isAdminPrincipal(user?.roles ?? [user?.role ?? "student"]);
}

export function saveSession(user: SessionUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(user));
  notifySessionChanged();
}

export function loadSession(): SessionUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<SessionUser> & { roles?: unknown };
    if (!parsed.studentId || !parsed.accessToken) return null;
    const roles = normalizeRoles(parsed.roles ?? parsed.role);
    return {
      studentId: parsed.studentId,
      name: parsed.name ?? "",
      login: parsed.login ?? "",
      characterId: parsed.characterId ?? "",
      accessToken: parsed.accessToken,
      roles,
      role: normalizeRole(parsed.role ?? roles[0]),
      profileComplete: Boolean(parsed.profileComplete),
    };
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
  localStorage.removeItem("mos.profile");
  localStorage.removeItem("mos.player-profile");
  localStorage.removeItem("mos.username");
  localStorage.removeItem("mos.selectedSkinId");
  localStorage.removeItem("mos.skin");
  localStorage.removeItem("mos.gender");
  localStorage.removeItem("mos.background");
  localStorage.removeItem("mos.avatarUrl");
  notifySessionChanged();
}

export function hasProfile(session?: SessionUser | null): boolean {
  if (session?.profileComplete) return true;
  if (typeof window === "undefined") return false;
  if (localStorage.getItem("mos.profile") === "1") return true;
  const raw = localStorage.getItem(PROFILE_CACHE_KEY);
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw) as { profileComplete?: boolean };
    return Boolean(parsed.profileComplete);
  } catch {
    return false;
  }
}

/** @deprecated backend is source of truth; kept for legacy callers */
export function markProfileCreated() {
  localStorage.setItem("mos.profile", "1");
}

export function authHeaders(user: SessionUser): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user.accessToken}`,
  };
}

export function homePathForRole(role: UserRole, profileReady: boolean): string {
  return homePathForRoles([role], profileReady);
}

export function patchSession(partial: Partial<SessionUser>) {
  const current = loadSession();
  if (!current) return;
  const next = { ...current, ...partial };
  const unchanged =
    next.studentId === current.studentId &&
    next.name === current.name &&
    next.login === current.login &&
    next.characterId === current.characterId &&
    next.accessToken === current.accessToken &&
    next.role === current.role &&
    next.profileComplete === current.profileComplete &&
    next.roles.length === current.roles.length &&
    next.roles.every((role, index) => role === current.roles[index]);
  if (unchanged) return;
  saveSession(next);
}
