"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { clearSession, hasRole, isAdminPrincipal, loadSession } from "@/lib/session";
import { formatRoleBadges, getRoleCabinetMenuItems, getSettingsTabs } from "@/lib/profile-menu";
import { routes } from "@/lib/routes";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const session = typeof window !== "undefined" ? loadSession() : null;
  const tabs = useMemo(() => getSettingsTabs(session?.roles ?? ["student"]), [session?.roles]);
  const [tab, setTab] = useState(tabs[0]?.id ?? "personal");
  const roleLinks = useMemo(() => getRoleCabinetMenuItems(session?.roles ?? []), [session?.roles]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="border border-mos-line/40 bg-mos-stone/40 p-5">
        <p className="font-display text-2xl text-mos-text">{session?.name ?? "Ученик"}</p>
        <p className="text-sm text-mos-muted">{session?.login}</p>
        {session && <p className="mt-2 text-xs text-mos-amber">{formatRoleBadges(session.roles)}</p>}
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[220px_1fr]">
        <aside className="space-y-2">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`block w-full border px-3 py-2 text-left text-sm ${
                tab === item.id ? "border-mos-amber text-mos-amber" : "border-mos-line/40 text-mos-muted"
              }`}
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            className="mos-btn mt-4 w-full text-xs"
            onClick={() => {
              clearSession();
              router.push("/");
            }}
          >
            Выйти
          </button>
        </aside>

        <section className="border border-mos-line/40 bg-mos-bg/50 p-5 text-sm text-mos-muted">
          {tab === "personal" && (
            <p>Личные данные ученика. Презентация персонажа меняется на странице профиля, не здесь.</p>
          )}
          {tab === "security" && (
            <p>Сессии OnlyID, смена пароля demo-аккаунта, MFA для staff (sandbox).</p>
          )}
          {tab === "privacy" && (
            <p>Профиль несовершеннолетних private by default. Публичный шаринг отключён.</p>
          )}
          {tab === "notifications" && (
            <p>Напоминания о тренировках и квестах через School Communications.</p>
          )}

          {tab === "admin" && session && isAdminPrincipal(session.roles) && (
            <div className="space-y-4">
              <p>Управление платформой, пользователями и контентом школы.</p>
              <Link href={routes.admin} className="mos-btn inline-flex">
                Войти в админ-панель
              </Link>
              {roleLinks
                .filter((item) => item.href !== routes.admin)
                .map((item) => (
                  <Link key={item.id} href={item.href} className="ml-3 inline-flex border border-mos-line/40 px-3 py-2 text-mos-text hover:border-mos-amber">
                    {item.label}
                  </Link>
                ))}
            </div>
          )}

          {tab === "coach" && session && hasRole(session.roles, "coach") && (
            <div className="space-y-4">
              <p>Расписание, группы и подтверждение посещаемости.</p>
              <Link href={routes.coach} className="mos-btn inline-flex">
                Открыть кабинет тренера
              </Link>
            </div>
          )}

          {tab === "guardian" && session && hasRole(session.roles, "guardian") && (
            <div className="space-y-4">
              <p>Кабинет опекуна: прогресс подопечных и уведомления школы.</p>
              <Link href={routes.guardian} className="mos-btn inline-flex">
                Открыть кабинет опекуна
              </Link>
            </div>
          )}

          {tab === "renter" && session && hasRole(session.roles, "renter") && (
            <div className="space-y-4">
              <p>Бронирование залов и управление арендой.</p>
              <Link href={routes.renter} className="mos-btn inline-flex">
                Открыть кабинет арендатора
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
