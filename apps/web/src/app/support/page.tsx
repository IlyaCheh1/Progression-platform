"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupportCase, fetchMySupportCases, type SupportCase } from "@/lib/support-api";
import { loadSession, type SessionUser } from "@/lib/session";
import { routes } from "@/lib/routes";

export default function SupportPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [cases, setCases] = useState<SupportCase[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const s = loadSession();
    if (!s) {
      router.replace("/login");
      return;
    }
    setUser(s);
    fetchMySupportCases(s).then(setCases).catch(() => undefined);
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    try {
      const c = await createSupportCase(user, subject, body);
      setCases((prev) => [c, ...prev]);
      setSubject("");
      setBody("");
      setMessage(`Обращение ${c.id.slice(0, 8)} создано`);
    } catch {
      setMessage("Не удалось создать обращение");
    }
  }

  if (!user) {
    return <main className="grid min-h-screen place-items-center text-mos-muted">Загрузка…</main>;
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="font-display text-3xl text-mos-text">Поддержка</h1>
      <p className="mt-2 text-sm text-mos-muted">
        Сообщите о проблеме с наградами или прогрессом. Чат не меняет игровое состояние — только создаёт кейс для разбора.
      </p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <input
          className="w-full rounded border border-mos-line/40 bg-mos-stone/20 px-3 py-2 text-sm"
          placeholder="Тема"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />
        <textarea
          className="w-full rounded border border-mos-line/40 bg-mos-stone/20 px-3 py-2 text-sm"
          placeholder="Опишите проблему"
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
        />
        <button type="submit" className="mos-btn">
          Отправить
        </button>
      </form>
      {message && <p className="mt-4 text-sm text-mos-amber">{message}</p>}
      <ul className="mt-10 space-y-3">
        {cases.map((c) => (
          <li key={c.id} className="rounded border border-mos-line/30 p-3 text-sm">
            <p className="font-medium">{c.subject}</p>
            <p className="text-mos-muted">{c.status}</p>
          </li>
        ))}
      </ul>
      <Link href={routes.home} className="mt-8 inline-block text-sm underline">
        К профилю
      </Link>
    </main>
  );
}
