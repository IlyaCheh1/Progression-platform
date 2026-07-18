"use client";

import { useCallback, useEffect, useState } from "react";
import { SCHOOL_API } from "@/lib/utils";
import { authHeaders, loadSession, type SessionUser } from "@/lib/session";

type Quest = { key: string; title: string; type: string; xp: number };
type Achievement = { key: string; title: string; tiers: number | number[]; xp: number };

export default function AdminContentPage() {
  const [session, setSession] = useState<SessionUser | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [questForm, setQuestForm] = useState({ key: "", title: "", type: "CUSTOM", xp: 100 });
  const [achForm, setAchForm] = useState({ key: "", title: "", tiers: "1", xp: 250 });

  const reload = useCallback(async (user: SessionUser) => {
    setError("");
    const res = await fetch(`${SCHOOL_API}/v1/admin/content`, {
      headers: authHeaders(user),
    });
    if (!res.ok) {
      setError("Не удалось загрузить каталог контента.");
      return;
    }
    const data = await res.json();
    setQuests((data.quests as Quest[]) ?? []);
    setAchievements((data.achievements as Achievement[]) ?? []);
  }, []);

  useEffect(() => {
    const s = loadSession();
    if (!s) return;
    setSession(s);
    void reload(s);
  }, [reload]);

  async function createQuest(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    setMessage("");
    setError("");
    const res = await fetch(`${SCHOOL_API}/v1/admin/content/quests`, {
      method: "POST",
      headers: authHeaders(session),
      body: JSON.stringify({
        key: questForm.key.trim(),
        title: questForm.title.trim(),
        type: questForm.type.trim() || "CUSTOM",
        xp: Number(questForm.xp) || 0,
      }),
    });
    if (!res.ok) {
      setError("Не удалось создать задание.");
      return;
    }
    setMessage("Задание сохранено.");
    setQuestForm({ key: "", title: "", type: "CUSTOM", xp: 100 });
    await reload(session);
  }

  async function createAchievement(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    setMessage("");
    setError("");
    const tiersRaw = achForm.tiers.trim();
    const tiers = tiersRaw.includes(",")
      ? tiersRaw.split(",").map((x) => Number(x.trim())).filter((n) => !Number.isNaN(n))
      : Number(tiersRaw) || 1;
    const res = await fetch(`${SCHOOL_API}/v1/admin/content/achievements`, {
      method: "POST",
      headers: authHeaders(session),
      body: JSON.stringify({
        key: achForm.key.trim(),
        title: achForm.title.trim(),
        tiers,
        xp: Number(achForm.xp) || 0,
      }),
    });
    if (!res.ok) {
      setError("Не удалось создать достижение.");
      return;
    }
    setMessage("Достижение сохранено.");
    setAchForm({ key: "", title: "", tiers: "1", xp: 250 });
    await reload(session);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl text-mos-text">Контент</h1>
      <p className="mt-2 text-sm text-mos-muted">
        Создание заданий и достижений во временном in-memory каталоге school-api (сбрасывается при рестарте).
      </p>
      {error && <p className="mt-4 text-sm text-[#c45c2a]">{error}</p>}
      {message && <p className="mt-4 text-sm text-mos-amber">{message}</p>}

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section className="border border-mos-line/40 bg-mos-stone/20 p-5">
          <h2 className="font-display text-xl text-mos-amber">Новое задание</h2>
          <form onSubmit={createQuest} className="mt-4 space-y-3">
            <Field label="Key" value={questForm.key} onChange={(v) => setQuestForm((f) => ({ ...f, key: v }))} placeholder="quest.custom.demo" />
            <Field label="Title" value={questForm.title} onChange={(v) => setQuestForm((f) => ({ ...f, title: v }))} placeholder="Демо-задание" />
            <Field label="Type" value={questForm.type} onChange={(v) => setQuestForm((f) => ({ ...f, type: v }))} />
            <Field label="XP" value={String(questForm.xp)} onChange={(v) => setQuestForm((f) => ({ ...f, xp: Number(v) || 0 }))} />
            <button type="submit" className="mos-btn w-full">
              Создать задание
            </button>
          </form>
        </section>

        <section className="border border-mos-line/40 bg-mos-stone/20 p-5">
          <h2 className="font-display text-xl text-mos-amber">Новое достижение</h2>
          <form onSubmit={createAchievement} className="mt-4 space-y-3">
            <Field label="Key" value={achForm.key} onChange={(v) => setAchForm((f) => ({ ...f, key: v }))} placeholder="ach.custom.demo" />
            <Field label="Title" value={achForm.title} onChange={(v) => setAchForm((f) => ({ ...f, title: v }))} placeholder="Демо-достижение" />
            <Field label="Tiers" value={achForm.tiers} onChange={(v) => setAchForm((f) => ({ ...f, tiers: v }))} placeholder="1 или 1,5,10" />
            <Field label="XP" value={String(achForm.xp)} onChange={(v) => setAchForm((f) => ({ ...f, xp: Number(v) || 0 }))} />
            <button type="submit" className="mos-btn w-full">
              Создать достижение
            </button>
          </form>
        </section>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Catalog title="Quests" items={quests.map((q) => `${q.title} · ${q.type} · ${q.xp} XP`)} />
        <Catalog title="Achievements" items={achievements.map((a) => `${a.title} · ${a.xp} XP`)} />
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block text-xs uppercase tracking-widest text-mos-muted">
      {label}
      <input
        className="mt-1 w-full border border-mos-line bg-mos-bg px-3 py-2 text-mos-text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        required={label === "Key" || label === "Title"}
      />
    </label>
  );
}

function Catalog({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="border border-mos-line/40 p-4">
      <h3 className="font-display text-lg text-mos-text">
        {title} <span className="text-mos-amber">({items.length})</span>
      </h3>
      <ul className="mt-3 max-h-72 space-y-1 overflow-auto text-sm text-mos-muted">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
