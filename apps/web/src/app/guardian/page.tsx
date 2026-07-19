"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchDependants, type DependantSummary } from "@/lib/guardian-api";
import { hasRole, loadSession, type SessionUser } from "@/lib/session";
import { routes } from "@/lib/routes";

export default function GuardianCabinetPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [dependants, setDependants] = useState<DependantSummary[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const s = loadSession();
    if (!s) {
      router.replace("/login");
      return;
    }
    if (!hasRole(s.roles, "guardian")) {
      router.replace("/profile");
      return;
    }
    setUser(s);
    fetchDependants(s)
      .then(setDependants)
      .catch(() => setError("Не удалось загрузить подопечных"));
  }, [router]);

  if (!user) {
    return <main className="grid min-h-screen place-items-center text-mos-muted">Проверка доступа…</main>;
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <p className="font-display tracking-[0.18em] text-mos-amber">GUARDIAN</p>
      <h1 className="mt-2 font-display text-3xl text-mos-text">Кабинет опекуна</h1>
      <p className="mt-4 text-sm text-mos-muted">
        Расписание, платежи и разрешённый прогресс подопечных. Приватные профили детей скрыты по политике.
      </p>
      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      <ul className="mt-8 space-y-4">
        {dependants.map((d) => (
          <li key={d.studentId} className="rounded border border-mos-line/30 p-4">
            <p className="font-medium text-mos-text">{d.displayName}</p>
            <p className="mt-1 text-sm text-mos-muted">
              Уровень {d.level} · посещений {d.attendanceCount} · макс. ранг {d.maxRank}
              {d.hasMembership ? " · абонемент активен" : ""}
            </p>
            {d.progressPrivate && (
              <p className="mt-1 text-xs text-mos-amber">Детальный прогресс скрыт (несовершеннолетний)</p>
            )}
            {d.schedule.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm text-mos-text/85">
                {d.schedule.map((s) => (
                  <li key={s.id}>
                    {s.title} · {new Date(s.startsAt).toLocaleString("ru-RU")}
                  </li>
                ))}
              </ul>
            )}
            {d.payments.length > 0 && (
              <p className="mt-2 text-xs text-mos-muted">Платежей: {d.payments.length}</p>
            )}
          </li>
        ))}
        {dependants.length === 0 && !error && (
          <li className="text-sm text-mos-muted">Подопечные не привязаны. Администратор связывает guardian ↔ student.</li>
        )}
      </ul>
      <div className="mt-8 flex gap-4">
        <Link href={routes.home} className="mos-btn inline-flex">
          К профилю
        </Link>
        <Link href="/support" className="text-sm underline text-mos-muted">
          Поддержка
        </Link>
      </div>
    </main>
  );
}
