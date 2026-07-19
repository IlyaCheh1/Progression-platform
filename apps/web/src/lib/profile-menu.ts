import { CABINET_BY_ROLE, getSwitchableCabinetRoles } from "@/lib/cabinets";
import { hasRole, isAdminPrincipal, ROLE_LABELS, type UserRole } from "@/lib/rbac";
import { routes } from "@/lib/routes";

export type ProfileDropdownItem = {
  id: string;
  label: string;
  href: string;
  highlight?: boolean;
};

export type SettingsTabItem = {
  id: string;
  label: string;
};

const BASE_SETTINGS_TABS: SettingsTabItem[] = [
  { id: "personal", label: "Личные данные" },
  { id: "security", label: "Безопасность" },
  { id: "privacy", label: "Приватность" },
  { id: "notifications", label: "Уведомления" },
];

/** Пункты входа в ЛК ролей — показываются в dropdown профиля. */
export function getRoleCabinetMenuItems(roles: UserRole[]): ProfileDropdownItem[] {
  const items: ProfileDropdownItem[] = [];

  for (const role of getSwitchableCabinetRoles(roles)) {
    if (role === "student") continue;
    const cabinet = CABINET_BY_ROLE[role];
    items.push({
      id: `cabinet-${role}`,
      label: cabinet.label,
      href: cabinet.href,
      highlight: role === "administrator",
    });
  }

  if (isAdminPrincipal(roles)) {
    items.push({
      id: "studio",
      label: "Studio",
      href: routes.studio,
    });
  }

  return items;
}

/** Вкладки настроек: базовые + ролевые секции. */
export function getSettingsTabs(roles: UserRole[]): SettingsTabItem[] {
  const tabs = [...BASE_SETTINGS_TABS];

  if (isAdminPrincipal(roles)) {
    tabs.push({ id: "admin", label: "Администрирование" });
  }
  if (hasRole(roles, "coach")) {
    tabs.push({ id: "coach", label: "Кабинет тренера" });
  }
  if (hasRole(roles, "guardian")) {
    tabs.push({ id: "guardian", label: "Кабинет опекуна" });
  }
  if (hasRole(roles, "renter")) {
    tabs.push({ id: "renter", label: "Кабинет арендатора" });
  }

  return tabs;
}

export function formatRoleBadges(roles: UserRole[]): string {
  return roles.map((role) => ROLE_LABELS[role] ?? role).join(" · ");
}
