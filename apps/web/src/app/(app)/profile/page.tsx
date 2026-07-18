"use client";

import { useEffect, useState } from "react";
import { content } from "@/lib/content";
import { loadSession } from "@/lib/session";
import { SCHOOL_API } from "@/lib/utils";

export default function ProfilePage() {
  const [name, setName] = useState("");
  const [skin, setSkin] = useState("S");
  const [masteryTotal, setMasteryTotal] = useState(0);
  const [level, setLevel] = useState(1);
  const daily = content.quests.filter((q) => q.type === "DAILY").slice(0, 3);

  useEffect(() => {
    const s = loadSession();
    if (!s) return;
    setName(s.name);
    setSkin((localStorage.getItem("mos.skin") ?? "scholar")[0]?.toUpperCase() ?? "S");
    const xp = Number(localStorage.getItem("mos.xp") ?? "0");
    setLevel(Math.max(1, Math.floor(xp / 500) + 1));
    fetch(`${SCHOOL_API}/v1/students/${s.studentId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((st) => {
        if (!st) return;
        const m = st.mastery ?? {};
        const sum = Object.values(m as Record<string, number>).reduce((a, b) => a + Number(b), 0);
        setMasteryTotal(sum);
        setName(st.displayName ?? s.name);
      })
      .catch(() => undefined);
  }, []);

  return (
    <main className="relative min-h-[calc(100vh-72px)] overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/media/directions/1.jpg" alt="" className="absolute inset-0 h-full w-full object-cover brightness-[0.35]" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-72px)] max-w-6xl grid-cols-1 gap-6 px-4 py-8 md:grid-cols-[280px_1fr]">
        <aside className="space-y-4 self-center border border-mos-line/50 bg-mos-bg/70 p-4 backdrop-blur">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-mos-muted">Уровень</p>
            <p className="font-display text-3xl text-mos-amber">{level}</p>
            <div className="mt-2 h-1.5 w-full bg-mos-stone">
              <div className="h-full w-2/5 bg-mos-amber shadow-[0_0_12px_var(--mos-amber-glow)]" />
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-mos-muted">Мастерство (units)</p>
            <p className="font-display text-xl text-mos-text">{masteryTotal.toLocaleString("ru-RU")}</p>
          </div>
          <div>
            <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-mos-amber">Закреплённые задания</p>
            <ul className="space-y-2">
              {daily.map((q) => (
                <li key={q.key} className="border border-mos-line/30 px-3 py-2 text-sm">
                  <p className="text-mos-text">{q.title}</p>
                  <p className="text-xs text-mos-muted">{q.xp} XP</p>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="flex flex-col items-center justify-center">
          <div className="flex h-[55vh] w-48 items-end justify-center border border-mos-line/30 bg-gradient-to-t from-mos-amber/10 to-transparent md:w-64">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-40 w-28 items-center justify-center border border-mos-amber/40 bg-mos-stone/60 font-display text-3xl text-mos-amber">
                {skin}
              </div>
              <p className="font-display text-2xl text-mos-text">{name || "Ученик"}</p>
              <p className="text-xs uppercase tracking-[0.2em] text-mos-muted">Character</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
