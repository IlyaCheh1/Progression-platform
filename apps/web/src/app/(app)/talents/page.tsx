"use client";

import { useState } from "react";
import { content } from "@/lib/content";

export default function TalentsPage() {
  const [points, setPoints] = useState(3);
  const [learned, setLearned] = useState<Record<string, boolean>>({});
  const [active, setActive] = useState<string[]>([]);

  function learn(key: string) {
    if (learned[key] || points <= 0) return;
    setLearned((l) => ({ ...l, [key]: true }));
    setPoints((p) => p - 1);
  }

  function toggleActive(key: string) {
    if (!learned[key]) return;
    setActive((a) => (a.includes(key) ? a.filter((x) => x !== key) : [...a, key].slice(0, 4)));
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-mos-amber">Таланты</h1>
          <p className="mt-1 text-sm text-mos-muted">Discipline of the Hall — без мультипликаторов урона и unsafe load.</p>
        </div>
        <div className="border border-mos-line px-4 py-2">
          <p className="text-[10px] uppercase tracking-widest text-mos-muted">Очки навыков</p>
          <p className="font-display text-2xl text-mos-amber">{points}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {active.length === 0 && <p className="text-sm text-mos-muted">Нет активных талантов</p>}
        {active.map((k) => (
          <span key={k} className="border border-mos-amber/50 px-3 py-1 text-xs text-mos-amber">
            {content.talents.find((t) => t.key === k)?.title}
          </span>
        ))}
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {content.talents.map((t) => {
          const isLearned = !!learned[t.key];
          const isActive = active.includes(t.key);
          return (
            <article key={t.key} className={`border p-4 ${isActive ? "border-mos-amber bg-mos-amber/5" : "border-mos-line/40 bg-mos-stone/30"}`}>
              <h3 className="font-display text-lg text-mos-text">{t.title}</h3>
              <p className="text-xs text-mos-muted">{t.key}</p>
              <div className="mt-4 flex gap-2">
                <button type="button" disabled={isLearned || points <= 0} onClick={() => learn(t.key)} className="mos-btn text-[10px] disabled:opacity-40">
                  {isLearned ? "Изучено" : "Изучить"}
                </button>
                <button type="button" disabled={!isLearned} onClick={() => toggleActive(t.key)} className="mos-btn border-mos-line text-[10px] text-mos-text disabled:opacity-40">
                  {isActive ? "Снять" : "Актив."}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
