"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { labelForCadence, labelForDay, type HallRentalRequest } from "@/lib/landing/hall-rental";
import { authHeaders, loadSession } from "@/lib/session";
import { routes } from "@/lib/routes";

export default function AdminArendaPage() {
  const [items, setItems] = useState<HallRentalRequest[]>([]);
  const [error, setError] = useState("");
  const [viewer, setViewer] = useState("");

  useEffect(() => {
    const session = loadSession();
    if (!session) return;
    void (async () => {
      try {
        const res = await fetch("/api/hall-rental", { headers: authHeaders(session) });
        if (res.status === 401 || res.status === 403) {
          setError("Нужна роль администратора школы.");
          return;
        }
        if (!res.ok) {
          setError("Не удалось загрузить заявки. Проверьте school-api.");
          return;
        }
        const data = (await res.json()) as { items?: HallRentalRequest[]; viewer?: string };
        setItems(data.items ?? []);
        setViewer(data.viewer ?? session.login);
      } catch {
        setError("Сеть недоступна.");
      }
    })();
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <Link href={routes.admin} className="text-sm text-mos-muted underline">
        ← Админ
      </Link>
      <h1 className="mt-4 font-display text-3xl text-mos-text">Заявки на аренду зала</h1>
      <p className="mt-2 text-sm text-mos-muted">
        Хранилище: файл `.data/hall-rental-requests.json` на web. Inbox ЛК — фаза 2.
        {viewer ? ` Просмотр: ${viewer}.` : ""}
      </p>
      {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
      <ul className="mt-8 space-y-3">
        {items.map((item) => (
          <li key={item.id} className="border border-mos-line/40 bg-mos-stone/30 p-4">
            <p className="text-xs uppercase tracking-widest text-mos-amber">{item.id}</p>
            <p className="mt-1 font-display text-lg text-mos-text">{item.name}</p>
            <p className="mt-1 text-sm text-mos-muted">
              {item.phone}
              {item.email ? ` · ${item.email}` : ""}
            </p>
            <p className="mt-2 text-sm text-mos-text">
              {labelForCadence(item.cadence)} · {item.days.map(labelForDay).join(", ")} · {item.startTime} · {item.hours} ч
            </p>
            {item.comment ? <p className="mt-2 text-sm text-mos-muted">{item.comment}</p> : null}
            <p className="mt-2 text-xs text-mos-muted">{new Date(item.createdAt).toLocaleString("ru-RU")}</p>
          </li>
        ))}
        {items.length === 0 && !error ? <li className="text-sm text-mos-muted">Заявок пока нет</li> : null}
      </ul>
    </main>
  );
}
