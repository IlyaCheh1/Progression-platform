"use client";

import { useState } from "react";
import { clearSession, loadSession } from "@/lib/session";
import { useRouter } from "next/navigation";

const TABS = [
  { id: "personal", label: "Профиль" },
  { id: "security", label: "Безопасность" },
  { id: "privacy", label: "Приватность" },
  { id: "notifications", label: "Уведомления" },
] as const;

export default function SettingsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("personal");
  const session = typeof window !== "undefined" ? loadSession() : null;
  const router = useRouter();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="border border-mos-line/40 bg-mos-stone/40 p-5">
        <p className="font-display text-2xl text-mos-text">{session?.name ?? "Ученик"}</p>
        <p className="text-sm text-mos-muted">{session?.login}</p>
      </div>
      <div className="mt-6 grid gap-6 md:grid-cols-[220px_1fr]">
        <aside className="space-y-2">
          {TABS.map((t) => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)} className={`block w-full border px-3 py-2 text-left text-sm ${tab === t.id ? "border-mos-amber text-mos-amber" : "border-mos-line/40 text-mos-muted"}`}>
              {t.label}
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
          {tab === "personal" && <p>Личные данные ученика. Character presentation меняется в профиле, не здесь.</p>}
          {tab === "security" && <p>Сессии OnlyID, смена пароля demo-аккаунта, MFA для staff (sandbox).</p>}
          {tab === "privacy" && <p>Профиль несовершеннолетних private by default. Публичный шаринг отключён.</p>}
          {tab === "notifications" && <p>Напоминания о тренировках и квестах через School Communications.</p>}
        </section>
      </div>
    </main>
  );
}
