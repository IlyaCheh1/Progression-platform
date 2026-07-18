"use client";

import { useState } from "react";

type Plan = { id: string; title: string; price: string; note?: string; popular?: boolean };

const GROUP: Plan[] = [
  { id: "trial", title: "Пробное занятие", price: "Бесплатно", note: "Одно посещение" },
  { id: "m1", title: "Месяц", price: "от 6 000 ₽" },
  { id: "m3", title: "3 месяца", price: "от 15 500 ₽", popular: true },
  { id: "m6", title: "6 месяцев", price: "от 28 000 ₽" },
];

const SOLO: Plan[] = [
  { id: "trial", title: "Пробное занятие", price: "Бесплатно", note: "Диагностика техники" },
  { id: "m1", title: "Месяц", price: "от 12 000 ₽" },
  { id: "m3", title: "3 месяца", price: "от 32 000 ₽", popular: true },
  { id: "m6", title: "6 месяцев", price: "от 58 000 ₽" },
];

export default function Tariffs() {
  const [tab, setTab] = useState<"group" | "solo">("group");
  const plans = tab === "group" ? GROUP : SOLO;

  return (
    <section id="tariffs" className="py-24">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="font-display text-3xl tracking-[0.12em] text-mos-amber">Тарифы</h2>
        <p className="mt-2 text-mos-muted">Два раздела: групповые и индивидуальные тренировки.</p>
        <div className="mt-6 inline-flex border border-mos-line">
          <button type="button" onClick={() => setTab("group")} className={`px-5 py-2 text-xs uppercase tracking-[0.16em] ${tab === "group" ? "bg-mos-amber/20 text-mos-amber" : "text-mos-muted"}`}>
            Групповые
          </button>
          <button type="button" onClick={() => setTab("solo")} className={`px-5 py-2 text-xs uppercase tracking-[0.16em] ${tab === "solo" ? "bg-mos-amber/20 text-mos-amber" : "text-mos-muted"}`}>
            Индивидуальные
          </button>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((p) => (
            <div
              key={p.id}
              className={`relative border p-5 ${p.popular ? "border-mos-amber bg-mos-amber/5" : "border-mos-line/40 bg-mos-stone/30"}`}
            >
              {p.popular && (
                <span className="absolute -top-3 left-4 bg-mos-amber px-2 py-0.5 font-display text-[10px] uppercase tracking-widest text-black">
                  Самое популярное
                </span>
              )}
              <h3 className="font-display text-lg text-mos-text">{p.title}</h3>
              <p className="mt-4 text-2xl text-mos-amber">{p.price}</p>
              {p.note && <p className="mt-2 text-xs text-mos-muted">{p.note}</p>}
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-mos-muted">Цены-плейсхолдеры до утверждения прайса школы.</p>
      </div>
    </section>
  );
}
