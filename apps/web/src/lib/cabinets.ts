import { normalizeRoles, primaryRole, type UserRole } from "@/lib/rbac";

/** Активный кабинет (как в Playtest: assigned roles ≠ active cabinet). */
export type CabinetRoleKey = "administrator" | "coach" | "guardian" | "renter" | "student";

export const ACTIVE_ROLE_STORAGE_KEY = "mos:active-role";

export const CABINET_BY_ROLE: Record<
  CabinetRoleKey,
  { label: string; href: string; badge: string; switchLabel: string }
> = {
  administrator: {
    label: "Админка",
    href: "/admin",
    badge: "Админ",
    switchLabel: "админку",
  },
  coach: {
    label: "Кабинет тренера",
    href: "/coach",
    badge: "Тренер",
    switchLabel: "кабинет тренера",
  },
  guardian: {
    label: "Кабинет опекуна",
    href: "/guardian",
    badge: "Опекун",
    switchLabel: "кабинет опекуна",
  },
  renter: {
    label: "Кабинет арендатора",
    href: "/renter",
    badge: "Арендатор",
    switchLabel: "кабинет арендатора",
  },
  student: {
    label: "Профиль ученика",
    href: "/profile",
    badge: "Ученик",
    switchLabel: "профиль ученика",
  },
};

const ROLE_ORDER: CabinetRoleKey[] = ["administrator", "coach", "guardian", "renter", "student"];

function toCabinetRole(role: UserRole): CabinetRoleKey | null {
  if (role === "platform_admin" || role === "administrator") return "administrator";
  if (role === "coach" || role === "guardian" || role === "renter" || role === "student") return role;
  return null;
}

export function userRoleToCabinetRole(role: UserRole): CabinetRoleKey {
  return toCabinetRole(role) ?? "student";
}

export function getSwitchableCabinetRoles(roles: UserRole[]): CabinetRoleKey[] {
  const set = new Set<CabinetRoleKey>();
  for (const role of normalizeRoles(roles)) {
    const key = toCabinetRole(role);
    if (key) set.add(key);
  }
  return ROLE_ORDER.filter((key) => set.has(key));
}

export function hasMultipleCabinetRoles(roles: UserRole[]): boolean {
  return getSwitchableCabinetRoles(roles).length >= 2;
}

export function roleFromPathname(pathname: string): CabinetRoleKey | null {
  if (pathname.startsWith("/admin") || pathname.startsWith("/studio")) return "administrator";
  if (pathname.startsWith("/coach")) return "coach";
  if (pathname.startsWith("/guardian")) return "guardian";
  if (pathname.startsWith("/renter")) return "renter";
  if (
    pathname.startsWith("/profile") ||
    pathname.startsWith("/inventory") ||
    pathname.startsWith("/achievements") ||
    pathname.startsWith("/talents") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/onboarding")
  ) {
    return "student";
  }
  return null;
}

export function resolveActiveCabinetRole(
  roles: UserRole[],
  preferred?: CabinetRoleKey | null,
): CabinetRoleKey | null {
  const available = getSwitchableCabinetRoles(roles);
  if (available.length === 0) return null;
  if (preferred && available.includes(preferred)) return preferred;
  return userRoleToCabinetRole(primaryRole(roles));
}

export function getNextCabinetRole(roles: UserRole[], current: CabinetRoleKey | null): CabinetRoleKey | null {
  const available = getSwitchableCabinetRoles(roles);
  if (available.length < 2 || !current) return null;
  const index = available.indexOf(current);
  if (index < 0) return available[0] ?? null;
  return available[(index + 1) % available.length] ?? null;
}

export function readStoredActiveRole(): CabinetRoleKey | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(ACTIVE_ROLE_STORAGE_KEY);
  if (value && value in CABINET_BY_ROLE) {
    return value as CabinetRoleKey;
  }
  return null;
}

export function writeStoredActiveRole(role: CabinetRoleKey): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACTIVE_ROLE_STORAGE_KEY, role);
}

export function getCabinetHref(role: CabinetRoleKey): string {
  return CABINET_BY_ROLE[role].href;
}
