"use client";

import { directions } from "@/lib/content";

export default function SchoolsMenu() {
  return (
    <div className="min-w-[240px] rounded-2xl border border-mos-line/50 bg-mos-stone p-3 shadow-2xl md:min-w-[280px] md:p-4">
      <p className="mb-2 px-2 text-[10px] uppercase tracking-[0.2em] text-mos-muted">Направления школы</p>
      <ul className="space-y-1">
        {directions.map((school) => (
          <li
            key={school.key}
            className="rounded-lg px-3 py-2 text-sm text-mos-muted"
          >
            <p className="text-mos-text">{school.title}</p>
            <p className="text-xs text-mos-muted/80">{school.description}</p>
          </li>
        ))}
      </ul>
      <p className="mt-2 px-2 text-[10px] text-mos-muted/70">Ссылки появятся позже</p>
    </div>
  );
}
