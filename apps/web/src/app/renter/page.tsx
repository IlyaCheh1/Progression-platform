"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { hasRole, loadSession, type SessionUser } from "@/lib/session";

export default function RenterCabinetPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    const s = loadSession();
    if (!s) {
      router.replace("/login");
      return;
    }
    if (!hasRole(s.roles, "renter")) {
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
      <p className="font-display tracking-[0.18em] text-mos-amber">RENTER</p>
      <h1 className="mt-2 font-display text-3xl text-mos-text">Кабинет арендатора</h1>
      <p className="mt-4 text-sm text-mos-muted">
        Бронирование залов и управление арендой — будет подключено вместе с модулем Hall Calendar.
      </p>
      <ul className="mt-8 space-y-2 text-sm text-mos-text/85">
        <li>• Календарь доступности залов</li>
        <li>• Заявки на аренду</li>
        <li>• Статус оплаты и договоров</li>
      </ul>
      <Link href="/profile" className="mos-btn mt-8 inline-flex">
        К профилю
      </Link>
    </main>
  );
}
