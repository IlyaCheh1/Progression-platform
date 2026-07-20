"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearSession, hasRole, isAdminPrincipal, loadSession, type SessionUser } from "@/lib/session";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Обзор" },
  { href: "/admin/school", label: "Школа" },
  { href: "/admin/users", label: "Пользователи" },
  { href: "/admin/content", label: "Контент" },
  { href: "/coach", label: "Тренер", coachOnly: true },
] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    const s = loadSession();
    if (!s) {
      router.replace("/login");
      return;
    }
    if (!isAdminPrincipal(s.roles)) {
      router.replace("/profile");
      return;
    }
    setUser(s);
  }, [router]);

  if (!user) {
    return <main className="grid min-h-screen place-items-center text-mos-muted">Проверка доступа…</main>;
  }

  return (
    <div className="min-h-screen bg-mos-bg">
      <header className="border-b border-mos-line/50 bg-mos-bg/90">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="font-display tracking-[0.18em] text-mos-amber">ADMIN</p>
            <p className="text-xs text-mos-muted">{user.name} · {user.login}</p>
          </div>
          <nav className="flex flex-wrap gap-2">
            {NAV.map((item) => {
              if ("coachOnly" in item && item.coachOnly && !hasRole(user.roles, "coach")) {
                return null;
              }
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "border px-3 py-1 text-xs uppercase tracking-widest",
                    active ? "border-mos-amber text-mos-amber" : "border-mos-line/40 text-mos-muted hover:text-mos-text",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link href={routes.studio} className="border border-mos-line/40 px-3 py-1 text-xs uppercase tracking-widest text-mos-muted hover:text-mos-text">
              Студия
            </Link>
            <Link href={routes.home} className="border border-mos-line/40 px-3 py-1 text-xs uppercase tracking-widest text-mos-muted hover:text-mos-text">
              Профиль
            </Link>
            <button
              type="button"
              className="border border-mos-line/40 px-3 py-1 text-xs uppercase tracking-widest text-mos-muted hover:text-mos-text"
              onClick={() => {
                void (async () => {
                  clearSession();
                  try {
                    const res = await fetch("/api/auth/logout", { method: "POST" });
                    if (res.ok) {
                      const data = (await res.json()) as { ssoLogoutUrl?: string | null };
                      if (data.ssoLogoutUrl) {
                        window.location.assign(data.ssoLogoutUrl);
                        return;
                      }
                    }
                  } catch {
                    // local logout fallback
                  }
                  router.push("/login");
                })();
              }}
            >
              Выйти
            </button>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
