"use client";

import type { ReactNode } from "react";
import { SETTINGS_TAB_ICONS } from "@/components/settings/settings-icons";
import { cn } from "@/lib/utils";

export type SideBarItem = {
  id: string;
  label: string;
  icon?: ReactNode;
};

type SideBarProps = {
  items: SideBarItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
  footer?: ReactNode;
  syncUrlParam?: string;
};

export default function SideBar({
  items,
  activeId,
  onChange,
  className,
  footer,
  syncUrlParam,
}: SideBarProps) {
  function select(id: string) {
    onChange(id);
    if (syncUrlParam && typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set(syncUrlParam, id);
      window.history.replaceState({}, "", url.toString());
    }
  }

  return (
    <aside
      className={cn(
        "bg-secondaryBg flex w-full flex-col gap-1 rounded-2xl p-3 backdrop-blur-[25px] md:w-[210px] md:min-w-[210px] md:rounded-[28px] md:p-5 lg:w-[250px] lg:min-w-[250px]",
        className,
      )}
    >
      {items.map((item) => {
        const active = item.id === activeId;
        const Icon = SETTINGS_TAB_ICONS[item.id];
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => select(item.id)}
            className={cn(
              "flex h-9 w-full items-center gap-3 rounded-2xl px-3 py-2 text-left text-xs transition-colors md:h-12 md:text-sm",
              active ? "bg-white/10 font-medium text-mos-text" : "text-mos-muted hover:bg-white/5 hover:text-mos-text",
            )}
          >
            {item.icon ?? (Icon ? <Icon className="h-5 w-5 shrink-0 md:h-6 md:w-6" /> : null)}
            <span>{item.label}</span>
          </button>
        );
      })}
      {footer ? <div className="mt-3 border-t border-white/10 pt-3">{footer}</div> : null}
    </aside>
  );
}
