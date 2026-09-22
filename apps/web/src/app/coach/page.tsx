"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import OpsCalendar from "@/components/admin/ops-calendar";
import { hasRole, loadSession, type SessionUser } from "@/lib/session";
import { routes } from "@/lib/routes";

export default function CoachCabinetPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionUser | null>(null);

  useEffect(() => {
    const s = loadSession();
    if (!s) {
      router.replace("/login");
      return;
    }
    if (!hasRole(s.roles, "coach") && !hasRole(s.roles, "administrator") && !hasRole(s.roles, "platform_admin")) {
      router.replace("/profile");
      return;
    }
    setSession(s);
  }, [router]);

  if (!session) {
    return <main className="grid min-h-screen place-items-center text-mos-muted">Проверка доступа…</main>;
  }

  const coachOnly = hasRole(session.roles, "coach") && !hasRole(session.roles, "administrator") && !hasRole(session.roles, "platform_admin");

  return (
    <main className="mx-auto max-w-6xl px-4 py-16">
      <p className="font-display tracking-[0.18em] text-mos-amber">COACH</p>
      <h1 className="mt-2 font-display text-3xl text-mos-text">Кабинет тренера</h1>
      <p className="mt-4 text-sm text-mos-muted">
        Ваши тренировки: состав группы, посещаемость и результаты после занятия.
      </p>
      <Link href={routes.home} className="mt-4 inline-flex text-xs uppercase tracking-widest text-mos-muted hover:text-mos-amber">
        ← Профиль
      </Link>

      <div className="mt-10">
        <OpsCalendar
          coachOnlyId={coachOnly ? session.studentId : undefined}
          allowCreate={!coachOnly}
          allowRental={false}
        />
      </div>
    </main>
  );
}
