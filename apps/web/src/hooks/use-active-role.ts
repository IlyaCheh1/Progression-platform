"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  CABINET_BY_ROLE,
  getCabinetHref,
  getNextCabinetRole,
  getSwitchableCabinetRoles,
  hasMultipleCabinetRoles,
  readStoredActiveRole,
  resolveActiveCabinetRole,
  roleFromPathname,
  writeStoredActiveRole,
  type CabinetRoleKey,
} from "@/lib/cabinets";
import { loadSession, type SessionUser } from "@/lib/session";

/**
 * Активный кабинет для пользователей с несколькими ролями.
 * Паттерн Playtest: assigned roles в session, active role в localStorage + URL.
 */
export function useActiveRole(user: SessionUser | null) {
  const pathname = usePathname();
  const roles = user?.roles ?? [];
  const canSwitch = hasMultipleCabinetRoles(roles);

  const [preferredRole, setPreferredRole] = useState<CabinetRoleKey | null>(null);

  useEffect(() => {
    if (!user || !canSwitch) {
      setPreferredRole(null);
      return;
    }

    const fromPath = roleFromPathname(pathname);
    if (fromPath) {
      setPreferredRole(fromPath);
      writeStoredActiveRole(fromPath);
      return;
    }

    setPreferredRole((current) => current ?? readStoredActiveRole() ?? resolveActiveCabinetRole(roles));
  }, [canSwitch, pathname, roles, user]);

  const activeRole = useMemo(
    () => (user ? resolveActiveCabinetRole(roles, preferredRole) : null),
    [preferredRole, roles, user],
  );

  const nextRole = useMemo(() => getNextCabinetRole(roles, activeRole), [activeRole, roles]);

  const toggleActiveRole = useCallback(() => {
    if (!nextRole) return;
    writeStoredActiveRole(nextRole);
    window.location.assign(getCabinetHref(nextRole));
  }, [nextRole]);

  return {
    canSwitch,
    switchableRoles: getSwitchableCabinetRoles(roles),
    activeRole,
    activeRoleBadge: activeRole ? CABINET_BY_ROLE[activeRole].badge : null,
    nextRole,
    nextRoleLabel: nextRole ? CABINET_BY_ROLE[nextRole].switchLabel : null,
    toggleActiveRole,
  };
}
