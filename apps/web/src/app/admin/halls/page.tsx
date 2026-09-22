"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchHalls, upsertHall, type HallRow } from "@/lib/school-api";
import { loadSession, type SessionUser } from "@/lib/session";
import OpsCalendar from "@/components/admin/ops-calendar";

export default function AdminHallsPage() {
  const [session, setSession] = useState<SessionUser | null>(null);
  const [halls, setHalls] = useState<HallRow[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    setHalls(await fetchHalls());
  }, []);

  useEffect(() => {
    const s = loadSession();
    if (!s) return;
    setSession(s);
    void reload().catch(() => setError("Не удалось загрузить залы."));
  }, [reload]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    setBusy(true);
    setError("");
    try {
      await upsertHall(session, { name: name.trim() });
      setName("");
      setMessage("Зал добавлен.");
      await reload();
    } catch {
      setError("Не удалось создать зал.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl text-mos-text">Залы</h1>
      <p className="mt-2 text-sm text-mos-muted">Справочник залов и календарь занятости.</p>
      {error && <p className="mt-4 text-sm text-[#c45c2a]">{error}</p>}
      {message && <p className="mt-4 text-sm text-mos-amber">{message}</p>}

      <form onSubmit={(e) => void onCreate(e)} className="mt-6 flex flex-wrap gap-2">
        <input
          className="min-w-[16rem] flex-1 border border-mos-line bg-mos-bg px-3 py-2 text-mos-text"
          placeholder="Название зала"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <button type="submit" className="mos-btn" disabled={busy}>
          Добавить зал
        </button>
      </form>

      <ul className="mt-6 flex flex-wrap gap-2">
        {halls.map((h) => (
          <li key={h.id} className="border border-mos-line/40 px-3 py-2 text-sm text-mos-text">
            {h.name} <span className="text-xs text-mos-muted">({h.id})</span>
          </li>
        ))}
      </ul>

      <div className="mt-10">
        <OpsCalendar allowCreate allowRental />
      </div>
    </main>
  );
}
