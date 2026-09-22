"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchCommsLog, sendNotification } from "@/lib/school-api";
import { SCHOOL_API } from "@/lib/utils";
import { authHeaders, loadSession, type SessionUser } from "@/lib/session";

type UserRow = { id: string; displayName: string; login: string };

export default function AdminNotificationsPage() {
  const [session, setSession] = useState<SessionUser | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    recipient: "",
    channel: "email",
    purpose: "ops",
    templateKey: "school.notice",
  });

  const reload = useCallback(async (user: SessionUser) => {
    const [logRows, studentsRes] = await Promise.all([
      fetchCommsLog(user),
      fetch(`${SCHOOL_API}/v1/admin/students`, { headers: authHeaders(user) }),
    ]);
    setLog(logRows);
    if (studentsRes.ok) setUsers((await studentsRes.json()) as UserRow[]);
  }, []);

  useEffect(() => {
    const s = loadSession();
    if (!s) return;
    setSession(s);
    void reload(s).catch(() => setError("Не удалось загрузить журнал уведомлений."));
  }, [reload]);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await sendNotification(session, form);
      setMessage("Уведомление поставлено в журнал отправки.");
      await reload(session);
    } catch {
      setError("Не удалось отправить.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl text-mos-text">Уведомления</h1>
      <p className="mt-2 text-sm text-mos-muted">
        Отправка уведомлений пользователям (MVP: запись в журнал; провайдеры email/SMS — следующий этап).
      </p>
      {error && <p className="mt-4 text-sm text-[#c45c2a]">{error}</p>}
      {message && <p className="mt-4 text-sm text-mos-amber">{message}</p>}

      <form onSubmit={(e) => void onSend(e)} className="mt-8 grid gap-3 border border-mos-line/40 bg-mos-stone/20 p-5 md:grid-cols-2">
        <label className="block text-xs uppercase tracking-widest text-mos-muted">
          Получатель
          <select
            className="mt-1 w-full border border-mos-line bg-mos-bg px-3 py-2 text-mos-text"
            value={form.recipient}
            onChange={(e) => setForm((f) => ({ ...f, recipient: e.target.value }))}
            required
          >
            <option value="">Выбрать</option>
            {users.map((u) => (
              <option key={u.id} value={u.login}>
                {u.displayName} ({u.login})
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs uppercase tracking-widest text-mos-muted">
          Канал
          <select
            className="mt-1 w-full border border-mos-line bg-mos-bg px-3 py-2 text-mos-text"
            value={form.channel}
            onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value }))}
          >
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="push">Push</option>
            <option value="inapp">In-app</option>
          </select>
        </label>
        <label className="block text-xs uppercase tracking-widest text-mos-muted">
          Назначение
          <input
            className="mt-1 w-full border border-mos-line bg-mos-bg px-3 py-2 text-mos-text"
            value={form.purpose}
            onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))}
          />
        </label>
        <label className="block text-xs uppercase tracking-widest text-mos-muted">
          Шаблон
          <input
            className="mt-1 w-full border border-mos-line bg-mos-bg px-3 py-2 text-mos-text"
            value={form.templateKey}
            onChange={(e) => setForm((f) => ({ ...f, templateKey: e.target.value }))}
          />
        </label>
        <div className="md:col-span-2">
          <button type="submit" className="mos-btn" disabled={busy}>
            Отправить
          </button>
        </div>
      </form>

      <h2 className="mt-10 font-display text-xl text-mos-amber">Журнал</h2>
      <ul className="mt-4 space-y-1 font-mono text-xs text-mos-muted">
        {[...log].reverse().map((line, i) => (
          <li key={`${i}-${line}`}>{line}</li>
        ))}
        {log.length === 0 && <li>Пусто</li>}
      </ul>
    </main>
  );
}
