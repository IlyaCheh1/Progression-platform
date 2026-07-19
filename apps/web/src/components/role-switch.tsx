"use client";

import { useState } from "react";
import { useActiveRole } from "@/hooks/use-active-role";
import { CABINET_BY_ROLE, type CabinetRoleKey } from "@/lib/cabinets";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/session";

type RoleSwitchProps = {
  user?: SessionUser | null;
  className?: string;
  compact?: boolean;
};

/** Переключение активного кабинета (паттерн Playtest workshop-role-switch). */
export function RoleSwitch({ user, className, compact = false }: RoleSwitchProps) {
  const { canSwitch, activeRole, activeRoleBadge, nextRoleLabel, toggleActiveRole } = useActiveRole(user ?? null);
  const [switching, setSwitching] = useState(false);

  if (!canSwitch || !activeRole || !nextRoleLabel) return null;

  const button = (
    <button
      type="button"
      className={cn(
        "border border-mos-line/40 px-3 py-1.5 text-xs uppercase tracking-widest text-mos-muted transition-colors hover:border-mos-amber/40 hover:text-mos-amber",
        compact && "px-2 py-1 text-[10px]",
      )}
      disabled={switching}
      onClick={() => {
        if (switching) return;
        setSwitching(true);
        toggleActiveRole();
      }}
    >
      {switching ? "Переключаем…" : `Сменить на ${nextRoleLabel}`}
    </button>
  );

  if (compact) {
    return <div className={className}>{button}</div>;
  }

  return (
    <div className={cn("rounded-2xl border border-dashed border-mos-line/40 bg-mos-stone/20 px-4 py-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <span className="text-sm text-mos-muted">Активная роль</span>
          <RoleBadge role={activeRole} label={activeRoleBadge ?? activeRole} />
        </div>
        {button}
      </div>
    </div>
  );
}

function RoleBadge({ role, label }: { role: CabinetRoleKey; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium leading-none",
        role === "administrator" && "bg-mos-amber/15 text-mos-amber",
        role === "coach" && "bg-[#c45c2a]/15 text-[#e07a45]",
        role === "guardian" && "bg-[#5a8f7b]/15 text-[#7eb09a]",
        role === "renter" && "bg-white/10 text-white/75",
        role === "student" && "bg-white/5 text-mos-text/80",
      )}
    >
      {label}
    </span>
  );
}
