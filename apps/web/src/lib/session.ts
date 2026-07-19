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
};

const KEY = "mos.session";

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

export function homePathForRole(role: UserRole, profileReady: boolean): string {
  return homePathForRoles([role], profileReady);
}
