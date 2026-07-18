"use client";

import { directions } from "@/lib/content";

export default function Directions() {
  return (
    <section id="directions" className="relative py-24">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="font-display text-3xl tracking-[0.12em] text-mos-amber">Направления</h2>
        <p className="mt-2 max-w-2xl text-mos-muted">Горизонтальный путь школ — выбери клинок и стиль.</p>
      </div>
      <div className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4">
        {directions.map((d, i) => (
          <article
            key={d.key}
            className="relative h-[70vh] min-w-[85vw] snap-center overflow-hidden border border-mos-line/50 md:min-w-[420px]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/media/directions/${i + 1}.jpg`}
              alt={d.title}
              className="absolute inset-0 h-full w-full object-cover brightness-[0.4]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
            <div className="absolute bottom-0 p-6">
              <h3 className="font-display text-2xl text-mos-amber">{d.title}</h3>
              <p className="mt-2 max-w-sm text-sm text-mos-text">{d.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
