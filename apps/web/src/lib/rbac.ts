export const ROLES = {
  guest: "guest",
  student: "student",
  guardian: "guardian",
  coach: "coach",
  renter: "renter",
  administrator: "administrator",
  platform_admin: "platform_admin",
} as const;

export type UserRole =
  | typeof ROLES.student
  | typeof ROLES.guardian
  | typeof ROLES.coach
  | typeof ROLES.renter
  | typeof ROLES.administrator
  | typeof ROLES.platform_admin;

export type Permission =
  | "users.read"
  | "users.create"
  | "users.update"
  | "users.delete"
  | "content.read"
  | "content.write"
  | "content.delete"
  | "school.read"
  | "attendance.confirm"
  | "dependants.read"
  | "halls.read";

const ALL_PERMISSIONS: Permission[] = [
  "users.read",
  "users.create",
  "users.update",
  "users.delete",
  "content.read",
  "content.write",
  "content.delete",
  "school.read",
  "attendance.confirm",
  "dependants.read",
  "halls.read",
];

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  student: ["school.read"],
  guardian: ["dependants.read", "school.read"],
  coach: ["school.read", "attendance.confirm"],
  renter: ["halls.read"],
  administrator: ALL_PERMISSIONS,
  platform_admin: ALL_PERMISSIONS,
};

export const ROLE_LABELS: Record<UserRole, string> = {
  student: "Ученик",
  guardian: "Опекун",
  coach: "Тренер",
  renter: "Арендатор",
  administrator: "Администратор",
  platform_admin: "Администратор платформы",
};

export const ASSIGNABLE_ROLES: UserRole[] = [
  "student",
  "guardian",
  "coach",
  "renter",
  "administrator",
];

export function normalizeRole(raw: unknown): UserRole {
  const value = typeof raw === "string" ? raw : "";
  if (value === "administrator" || value === "platform_admin") return value;
  if (value === "guardian" || value === "coach" || value === "renter") return value;
  return "student";
}

export function normalizeRoles(raw: unknown): UserRole[] {
  if (Array.isArray(raw)) {
    const roles = raw.map((item) => normalizeRole(item)).filter((role, index, list) => list.indexOf(role) === index);
    return roles.length > 0 ? roles : ["student"];
  }
  return [normalizeRole(raw)];
}

export function permissionsForRoles(roles: UserRole[]): Permission[] {
  const merged = new Set<Permission>();
  for (const role of normalizeRoles(roles)) {
    for (const perm of permissionsFor(role)) {
      merged.add(perm);
    }
  }
  return [...merged];
}

export function hasPermissionForRoles(roles: UserRole[], permission: Permission): boolean {
  return permissionsForRoles(roles).includes(permission);
}

export function hasRole(roles: UserRole[], role: UserRole): boolean {
  return normalizeRoles(roles).includes(role);
}

export function isAdminPrincipal(roles: UserRole[] | UserRole): boolean {
  const list = Array.isArray(roles) ? normalizeRoles(roles) : [normalizeRole(roles)];
  return list.includes("administrator") || list.includes("platform_admin");
}

export function canManageUsers(roles: UserRole[] | UserRole): boolean {
  const list = Array.isArray(roles) ? roles : [roles];
  return hasPermissionForRoles(list, "users.create") && hasPermissionForRoles(list, "users.update") && hasPermissionForRoles(list, "users.delete");
}

export function homePathForRoles(roles: UserRole[], profileReady: boolean): string {
  const list = normalizeRoles(roles);
  if (isAdminPrincipal(list)) return "/admin";
  if (hasRole(list, "coach")) return "/coach";
  if (hasRole(list, "guardian")) return "/guardian";
  if (hasRole(list, "renter")) return "/renter";
  return profileReady ? "/profile" : "/onboarding";
}

export function primaryRole(roles: UserRole[]): UserRole {
  const priority: UserRole[] = ["platform_admin", "administrator", "coach", "guardian", "renter", "student"];
  const list = normalizeRoles(roles);
  for (const role of priority) {
    if (list.includes(role)) return role;
  }
  return "student";
}

export function permissionsFor(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS.student;
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return permissionsFor(role).includes(permission);
}

/** @deprecated use isAdminPrincipal(roles) */
export function isAdminPrincipalRole(role: UserRole): boolean {
  return role === "administrator" || role === "platform_admin";
}

/** @deprecated use canManageUsers(roles) */
export function canManageUsersRole(role: UserRole): boolean {
  return hasPermission(role, "users.create") && hasPermission(role, "users.update") && hasPermission(role, "users.delete");
}

export function homePathForRole(role: UserRole, profileReady: boolean): string {
  return homePathForRoles([role], profileReady);
}

export function formatRoles(roles: UserRole[]): string {
  return normalizeRoles(roles)
    .map((role) => ROLE_LABELS[role] ?? role)
    .join(", ");
}
