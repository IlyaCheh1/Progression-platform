"use client";

import { useCallback, useEffect, useState } from "react";
import { deleteGroup, fetchGroups, upsertGroup, type GroupRow } from "@/lib/school-api";
import { SCHOOL_API } from "@/lib/utils";
import { authHeaders, loadSession, type SessionUser } from "@/lib/session";

type UserRow = { id: string; displayName: string; login: string; role: string; roles?: string[] };

export default function AdminGroupsPage() {
  const [session, setSession] = useState<SessionUser | null>(null);
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", coachId: "", direction: "", studentIds: [] as string[] });

  const reload = useCallback(async (user: SessionUser) => {
    const [g, studentsRes] = await Promise.all([
      fetchGroups(user),
      fetch(`${SCHOOL_API}/v1/admin/students`, { headers: authHeaders(user) }),
    ]);
    setGroups(g);
    if (studentsRes.ok) setUsers((await studentsRes.json()) as UserRow[]);
  }, []);

  useEffect(() => {
    const s = loadSession();
    if (!s) return;
    setSession(s);
    void reload(s).catch(() => setError("Не удалось загрузить группы."));
  }, [reload]);

  const coaches = users.filter((u) => (u.roles ?? [u.role]).includes("coach") || u.role === "coach");
  const students = users.filter((u) => {
    const roles = u.roles ?? [u.role];
    return roles.includes("student") || (!roles.includes("coach") && !roles.includes("administrator"));
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await upsertGroup(session, {
        id: editId ?? undefined,
        name: form.name.trim(),
        coachId: form.coachId || undefined,
        direction: form.direction || undefined,
        studentIds: form.studentIds,
      });
      setMessage(editId ? "Группа обновлена." : "Группа создана.");
      setEditId(null);
      setForm({ name: "", coachId: "", direction: "", studentIds: [] });
      await reload(session);
    } catch {
      setError("Не удалось сохранить группу.");
    } finally {
      setBusy(false);
    }
  }

  function toggleStudent(id: string) {
    setForm((f) => ({
      ...f,
      studentIds: f.studentIds.includes(id) ? f.studentIds.filter((x) => x !== id) : [...f.studentIds, id],
    }));
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl text-mos-text">Группы занятий</h1>
      <p className="mt-2 text-sm text-mos-muted">Назначение учеников и тренера в группу — при создании занятия состав копируется.</p>
      {error && <p className="mt-4 text-sm text-[#c45c2a]">{error}</p>}
      {message && <p className="mt-4 text-sm text-mos-amber">{message}</p>}

      <form onSubmit={(e) => void submit(e)} className="mt-8 grid gap-3 border border-mos-line/40 bg-mos-stone/20 p-5 md:grid-cols-2">
        <label className="block text-xs uppercase tracking-widest text-mos-muted">
          Название
          <input
            className="mt-1 w-full border border-mos-line bg-mos-bg px-3 py-2 text-mos-text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
        </label>
        <label className="block text-xs uppercase tracking-widest text-mos-muted">
          Направление
          <input
            className="mt-1 w-full border border-mos-line bg-mos-bg px-3 py-2 text-mos-text"
            value={form.direction}
            onChange={(e) => setForm((f) => ({ ...f, direction: e.target.value }))}
            placeholder="сабля / ушу / …"
          />
        </label>
        <label className="block text-xs uppercase tracking-widest text-mos-muted">
          Тренер
          <select
            className="mt-1 w-full border border-mos-line bg-mos-bg px-3 py-2 text-mos-text"
            value={form.coachId}
            onChange={(e) => setForm((f) => ({ ...f, coachId: e.target.value }))}
          >
            <option value="">—</option>
            {coaches.map((c) => (
              <option key={c.id} value={c.id}>
                {c.displayName}
              </option>
            ))}
          </select>
        </label>
        <div className="md:col-span-2">
          <p className="text-xs uppercase tracking-widest text-mos-muted">Ученики</p>
          <div className="mt-2 flex max-h-48 flex-wrap gap-2 overflow-y-auto">
            {students.map((s) => {
              const on = form.studentIds.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  className={`border px-2 py-1 text-xs ${on ? "border-mos-amber text-mos-amber" : "border-mos-line/40 text-mos-muted"}`}
                  onClick={() => toggleStudent(s.id)}
                >
                  {s.displayName}
                </button>
              );
            })}
          </div>
        </div>
        <div className="md:col-span-2 flex gap-2">
          <button type="submit" className="mos-btn" disabled={busy}>
            {editId ? "Сохранить" : "Создать группу"}
          </button>
          {editId && (
            <button
              type="button"
              className="border border-mos-line/40 px-3 py-2 text-xs uppercase tracking-widest text-mos-muted"
              onClick={() => {
                setEditId(null);
                setForm({ name: "", coachId: "", direction: "", studentIds: [] });
              }}
            >
              Отмена
            </button>
          )}
        </div>
      </form>

      <ul className="mt-8 space-y-3">
        {groups.map((g) => (
          <li key={g.id} className="flex flex-wrap items-center justify-between gap-3 border border-mos-line/40 p-4">
            <div>
              <p className="font-display text-mos-text">{g.name}</p>
              <p className="text-xs text-mos-muted">
                {g.direction || "без направления"} · учеников: {g.studentIds?.length ?? 0} · тренер:{" "}
                {users.find((u) => u.id === g.coachId)?.displayName ?? "—"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="mos-btn px-2 py-1 text-xs"
                onClick={() => {
                  setEditId(g.id);
                  setForm({
                    name: g.name,
                    coachId: g.coachId ?? "",
                    direction: g.direction ?? "",
                    studentIds: [...(g.studentIds ?? [])],
                  });
                }}
              >
                Изменить
              </button>
              <button
                type="button"
                className="border border-[#c45c2a]/40 px-2 py-1 text-xs text-[#c45c2a]"
                disabled={busy}
                onClick={() => {
                  if (!session || !window.confirm("Удалить группу?")) return;
                  void (async () => {
                    setBusy(true);
                    try {
                      await deleteGroup(session, g.id);
                      await reload(session);
                    } catch {
                      setError("Не удалось удалить.");
                    } finally {
                      setBusy(false);
                    }
                  })();
                }}
              >
                Удалить
              </button>
            </div>
          </li>
        ))}
        {groups.length === 0 && <li className="text-sm text-mos-muted">Групп пока нет</li>}
      </ul>
    </main>
  );
}
