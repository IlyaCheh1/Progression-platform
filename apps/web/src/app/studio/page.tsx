"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { content } from "@/lib/content";
import { isPlatformAdmin, loadSession } from "@/lib/session";

export default function StudioPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const s = loadSession();
    if (!s) {
      router.replace("/login");
      return;
    }
    if (!isPlatformAdmin(s)) {
      router.replace("/profile");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return <main className="grid min-h-screen place-items-center text-mos-muted">Проверка доступа…</main>;
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-mos-amber">Partner Content Studio</h1>
          <p className="mt-2 text-mos-muted">
            Read-only каталог starter bundle. Создание контента — в{" "}
            <Link href="/admin/content" className="text-mos-amber underline">
              /admin/content
            </Link>
            .
          </p>
        </div>
        <Link href="/admin" className="mos-btn text-xs">
          Админка
        </Link>
      </div>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <Panel title="Quests" count={content.quests.length} items={content.quests.map((q) => q.title)} />
        <Panel title="Achievements" count={content.achievements.length} items={content.achievements.map((a) => a.title)} />
        <Panel title="Talents" count={content.talents.length} items={content.talents.map((t) => t.title)} />
      </div>
      <p className="mt-8 text-xs text-mos-muted">
        Publish/validation/simulation — через authoring API; hardcode seed в обход validation запрещён (TZ §27).
      </p>
    </main>
  );
}

function Panel({ title, count, items }: { title: string; count: number; items: string[] }) {
  return (
    <section className="border border-mos-line/40 bg-mos-stone/30 p-4">
      <h2 className="font-display text-xl text-mos-text">
        {title} <span className="text-mos-amber">({count})</span>
      </h2>
      <ul className="mt-3 max-h-64 space-y-1 overflow-auto text-sm text-mos-muted">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </section>
  );
}
