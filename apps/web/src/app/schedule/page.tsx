"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { bookTrial, fetchPublicSchedule, type SessionRow } from "@/lib/school-api";
import { loadSession } from "@/lib/session";
import { routes } from "@/lib/routes";

export default function SchedulePage() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPublicSchedule()
      .then(setSessions)
      .catch(() => setError("Расписание недоступно."));
  }, []);

  async function onBook(sessionId: string) {
    const user = loadSession();
    if (!user) {
      window.location.href = routes.login;
      return;
    }
    setMessage("");
    setError("");
    try {
      const b = await bookTrial(user, sessionId);
      setMessage(`Запись подтверждена: ${b.id}`);
    } catch {
      setError("Не удалось записаться. Войдите как ученик.");
    }
  }

  return (
    <main className="min-h-screen bg-mos-bg px-4 py-10 text-mos-text">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm text-mos-accent underline">
          ← На главную
        </Link>
        <h1 className="mt-4 font-cinzel text-3xl">Расписание групп</h1>
        {message && <p className="mt-4 text-green-400">{message}</p>}
        {error && <p className="mt-4 text-red-400">{error}</p>}
        <ul className="mt-6 space-y-4">
          {sessions.map((s) => (
            <li key={s.id} className="rounded border border-mos-border p-4">
              <h2 className="font-golos font-semibold">{s.title}</h2>
              <p className="text-sm opacity-70">
                {new Date(s.startsAt).toLocaleString("ru-RU")} · мест {s.enrolled}/{s.capacity}
              </p>
              <button
                type="button"
                onClick={() => void onBook(s.id)}
                className="mt-3 rounded bg-mos-accent px-4 py-2 text-sm font-medium text-black"
              >
                Записаться на пробное
              </button>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
