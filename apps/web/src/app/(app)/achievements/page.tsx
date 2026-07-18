"use client";

import { useMemo, useState } from "react";
import { content } from "@/lib/content";

type Tab = "achievements" | "tasks";

export default function AchievementsPage() {
  const [tab, setTab] = useState<Tab>("achievements");
  const [filter, setFilter] = useState("ALL");
  const [pinned, setPinned] = useState<Record<string, boolean>>({});

  const quests = useMemo(() => {
    if (filter === "ALL") return content.quests;
    return content.quests.filter((q) => q.type === filter);
  }, [filter]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex gap-4 border-b border-mos-line/40 pb-3">
        {(
          [
            ["achievements", "Достижения"],
            ["tasks", "Задания"],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" onClick={() => setTab(id)} className={`text-sm uppercase tracking-[0.16em] ${tab === id ? "text-mos-amber" : "text-mos-muted"}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[200px_1fr]">
        <aside className="space-y-2 text-sm">
          {tab === "tasks"
            ? ["ALL", "DAILY", "WEEKLY", "MONTHLY", "ONBOARDING"].map((f) => (
                <button key={f} type="button" onClick={() => setFilter(f)} className={`block w-full border px-3 py-2 text-left ${filter === f ? "border-mos-amber text-mos-amber" : "border-mos-line/40 text-mos-muted"}`}>
                  {f}
                </button>
              ))
            : ["ALL", "practice", "mastery", "start", "community"].map((f) => (
                <button key={f} type="button" onClick={() => setFilter(f)} className={`block w-full border px-3 py-2 text-left ${filter === f ? "border-mos-amber text-mos-amber" : "border-mos-line/40 text-mos-muted"}`}>
                  {f}
                </button>
              ))}
        </aside>

        <div className="space-y-3">
          {tab === "achievements"
            ? content.achievements
                .filter((a) => filter === "ALL" || a.key.startsWith(filter))
                .map((a) => (
                  <article key={a.key} className="border border-mos-line/40 bg-mos-stone/40 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-lg text-mos-text">{a.title}</h3>
                        <p className="text-xs text-mos-muted">{a.key}</p>
                      </div>
                      <span className="text-mos-amber">{a.xp ? `${a.xp} XP` : "—"}</span>
                    </div>
                    <p className="mt-2 text-xs text-mos-muted">
                      Тиры: {Array.isArray(a.tiers) ? a.tiers.join(", ") : a.tiers}
                    </p>
                  </article>
                ))
            : quests.map((q) => (
                <article key={q.key} className="border border-mos-line/40 bg-mos-stone/40 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-lg text-mos-text">{q.title}</h3>
                      <p className="text-xs text-mos-muted">
                        {q.type} · {q.key}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-mos-amber">{q.xp} XP</span>
                      <button
                        type="button"
                        className="text-xs text-mos-muted hover:text-mos-amber"
                        onClick={() => setPinned((p) => ({ ...p, [q.key]: !p[q.key] }))}
                      >
                        {pinned[q.key] ? "Открепить" : "Закрепить"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
        </div>
      </div>
    </main>
  );
}
