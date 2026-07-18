"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { directions } from "@/lib/content";
import { cn } from "@/lib/utils";

const items = [
  { href: "/profile", label: "Профиль", icon: "◆" },
  { href: "/inventory", label: "Инвентарь", icon: "▣" },
  { href: "/achievements", label: "Достижения", icon: "◈" },
  { href: "/talents", label: "Таланты", icon: "✶" },
  { href: "/settings", label: "Настройки", icon: "⚙" },
];

export default function WitcherNav() {
  const pathname = usePathname();
  const [schoolsOpen, setSchoolsOpen] = useState(false);

  return (
    <header className="relative z-40 border-b border-mos-line/50 bg-mos-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-end justify-center gap-1 px-2 pt-3 md:gap-4">
        {items.slice(0, 4).map((it) => {
          const active = pathname === it.href || (it.href !== "/profile" && pathname.startsWith(it.href));
          return (
            <Link key={it.href} href={it.href} className={cn("relative flex min-w-[72px] flex-col items-center px-2 pb-3 pt-1", active ? "text-mos-amber" : "text-mos-muted hover:text-mos-text")}>
              <span className={cn("text-xl", active && "drop-shadow-[0_0_12px_var(--mos-amber-glow)]")}>{it.icon}</span>
              <span className="mt-1 text-[10px] uppercase tracking-[0.18em]">{it.label}</span>
              {active && <span className="absolute bottom-0 h-0 w-0 border-x-[5px] border-b-[6px] border-x-transparent border-b-mos-amber" />}
            </Link>
          );
        })}
        <div className="relative">
          <button
            type="button"
            onClick={() => setSchoolsOpen((v) => !v)}
            className={cn("flex min-w-[72px] flex-col items-center px-2 pb-3 pt-1", schoolsOpen ? "text-mos-amber" : "text-mos-muted hover:text-mos-text")}
          >
            <span className="text-xl">☰</span>
            <span className="mt-1 text-[10px] uppercase tracking-[0.18em]">Школы</span>
          </button>
          {schoolsOpen && (
            <div className="absolute left-1/2 top-full z-50 mt-1 w-64 -translate-x-1/2 border border-mos-line bg-mos-stone p-2 shadow-xl">
              {directions.map((d) => (
                <div key={d.key} className="cursor-default px-3 py-2 text-sm text-mos-muted">
                  {d.title}
                </div>
              ))}
              <p className="px-3 pb-2 text-[10px] text-mos-muted/70">Ссылки появятся позже</p>
            </div>
          )}
        </div>
        <Link href="/settings" className={cn("relative flex min-w-[72px] flex-col items-center px-2 pb-3 pt-1", pathname.startsWith("/settings") ? "text-mos-amber" : "text-mos-muted")}>
          <span className="text-xl">⚙</span>
          <span className="mt-1 text-[10px] uppercase tracking-[0.18em]">Настройки</span>
        </Link>
      </div>
    </header>
  );
}
