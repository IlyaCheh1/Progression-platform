"use client";

import { useState } from "react";
import { directions } from "@/lib/content";

export default function Services() {
  const [mode, setMode] = useState<"group" | "solo">("group");

  return (
    <section id="services" className="border-y border-mos-line/30 bg-mos-stone/40 py-24">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="font-display text-3xl tracking-[0.12em] text-mos-amber">Тренировки</h2>
        <div className="mt-6 inline-flex border border-mos-line">
          <button
            type="button"
            onClick={() => setMode("group")}
            className={`px-5 py-2 text-xs uppercase tracking-[0.16em] ${mode === "group" ? "bg-mos-amber/20 text-mos-amber" : "text-mos-muted"}`}
          >
            Групповые
          </button>
          <button
            type="button"
            onClick={() => setMode("solo")}
            className={`px-5 py-2 text-xs uppercase tracking-[0.16em] ${mode === "solo" ? "bg-mos-amber/20 text-mos-amber" : "text-mos-muted"}`}
          >
            Индивидуальные
          </button>
        </div>
        <p className="mt-4 max-w-2xl text-mos-muted">
          {mode === "group"
            ? "Занятия в группе: ритм зала, партнёрская работа и общий прогресс школы."
            : "Персональный разбор техники с тренером и ускоренная коррекция ошибок."}
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {directions.map((d) => (
            <div key={d.key} className="border border-mos-line/40 bg-mos-bg/60 p-5">
              <h3 className="font-display text-lg text-mos-text">{d.title}</h3>
              <p className="mt-2 text-sm text-mos-muted">{d.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
