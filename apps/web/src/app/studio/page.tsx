"use client";

import { content } from "@/lib/content";

export default function StudioPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl text-mos-amber">Partner Content Studio</h1>
      <p className="mt-2 text-mos-muted">MVP оболочка Stage 5: просмотр каталога Definitions из school.fencing starter bundle.</p>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <Panel title="Quests" count={content.quests.length} items={content.quests.map((q) => q.title)} />
        <Panel title="Achievements" count={content.achievements.length} items={content.achievements.map((a) => a.title)} />
        <Panel title="Talents" count={content.talents.length} items={content.talents.map((t) => t.title)} />
      </div>
      <p className="mt-8 text-xs text-mos-muted">Publish/validation/simulation — через authoring API; hardcode seed в обход validation запрещён (TZ §27).</p>
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
