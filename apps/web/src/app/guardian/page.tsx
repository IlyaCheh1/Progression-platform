"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loadSession, type SessionUser } from "@/lib/session";

export default function GuardianCabinetPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    const s = loadSession();
    if (!s) {
      router.replace("/login");
      return;
    }
    if (s.role !== "guardian") {
      router.replace("/profile");
      return;
    }
    setUser(s);
  }, [router]);

  if (!user) {
    return <main className="grid min-h-screen place-items-center text-mos-muted">Проверка доступа…</main>;
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <p className="font-display tracking-[0.18em] text-mos-amber">GUARDIAN</p>
      <h1 className="mt-2 font-display text-3xl text-mos-text">Кабинет опекуна</h1>
      <p className="mt-4 text-sm text-mos-muted">
        Расписание и прогресс подопечных, платежи и согласия — по мере подключения модулей CRM и Guardian policy.
      </p>
      <ul className="mt-8 space-y-2 text-sm text-mos-text/85">
        <li>• Просмотр авторизованных подопечных</li>
        <li>• Расписание занятий</li>
        <li>• Платежи и квитанции</li>
        <li>• Согласия и age-appropriate progression</li>
      </ul>
      <Link href="/profile" className="mos-btn mt-8 inline-flex">
        К профилю
      </Link>
    </main>
  );
}
