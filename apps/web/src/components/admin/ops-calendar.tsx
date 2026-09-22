"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  cancelAdminSession,
  createAdminSession,
  createRentalBooking,
  enrollStudent,
  fetchGroups,
  fetchHalls,
  fetchPublicSchedule,
  fetchSessionAttendance,
  markSessionAttendance,
  unenrollStudent,
  type GroupRow,
  type HallRow,
  type SessionAttendanceRow,
  type SessionRow,
} from "@/lib/school-api";
import { SCHOOL_API } from "@/lib/utils";
import { authHeaders, loadSession, type SessionUser } from "@/lib/session";

type UserRow = { id: string; displayName: string; login: string; role: string; roles?: string[] };

function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value: string): string {
  return new Date(value).toISOString();
}

function formatRange(startsAt: string, endsAt: string): string {
  const s = new Date(startsAt);
  const e = new Date(endsAt);
  return `${s.toLocaleString("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })} – ${e.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`;
}

type Props = {
  /** When set, only that coach's sessions are listed and create uses this coachId. */
  coachOnlyId?: string;
  allowCreate?: boolean;
  allowRental?: boolean;
};

export default function OpsCalendar({ coachOnlyId, allowCreate = true, allowRental = true }: Props) {
  const [session, setSession] = useState<SessionUser | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [halls, setHalls] = useState<HallRow[]>([]);
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<SessionAttendanceRow[]>([]);
  const [enrollStudentId, setEnrollStudentId] = useState("");
  const [resultNotes, setResultNotes] = useState<Record<string, string>>({});

  const now = useMemo(() => new Date(), []);
  const [form, setForm] = useState({
    title: "",
    hallId: "hall-main",
    groupKey: "",
    coachId: "",
    startsAt: toLocalInput(new Date(now.getTime() + 60 * 60 * 1000)),
    endsAt: toLocalInput(new Date(now.getTime() + 2.5 * 60 * 60 * 1000)),
    capacity: 12,
    mode: "session" as "session" | "rental",
  });

  const selected = sessions.find((s) => s.id === selectedId) ?? null;
  const hallName = useCallback(
    (id: string) => halls.find((h) => h.id === id)?.name ?? id,
    [halls],
  );

  const reload = useCallback(async (user: SessionUser) => {
    setError("");
    try {
      const [sess, hallRows, groupRows] = await Promise.all([
        fetchPublicSchedule(coachOnlyId ? { coachId: coachOnlyId } : undefined),
        fetchHalls(),
        fetchGroups(user).catch(() => [] as GroupRow[]),
      ]);
      setSessions(
        [...sess].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()),
      );
      setHalls(hallRows);
      setGroups(groupRows);
      if (hallRows[0] && !form.hallId) {
        setForm((f) => ({ ...f, hallId: hallRows[0]!.id }));
      }
      const studentsRes = await fetch(`${SCHOOL_API}/v1/admin/students`, { headers: authHeaders(user) }).catch(
        () => null,
      );
      if (studentsRes?.ok) {
        setUsers((await studentsRes.json()) as UserRow[]);
      } else {
        const alt = await fetch(`${SCHOOL_API}/v1/students`, { headers: authHeaders(user) });
        if (alt.ok) setUsers((await alt.json()) as UserRow[]);
      }
    } catch {
      setError("Не удалось загрузить календарь.");
    }
  }, [coachOnlyId, form.hallId]);

  useEffect(() => {
    const s = loadSession();
    if (!s) return;
    setSession(s);
    if (coachOnlyId) {
      setForm((f) => ({ ...f, coachId: coachOnlyId }));
    }
    void reload(s);
  }, [reload, coachOnlyId]);

  useEffect(() => {
    if (!session || !selectedId) {
      setAttendance([]);
      return;
    }
    void fetchSessionAttendance(session, selectedId)
      .then(setAttendance)
      .catch(() => setAttendance([]));
  }, [session, selectedId]);

  const coaches = users.filter((u) => (u.roles ?? [u.role]).includes("coach") || u.role === "coach");
  const students = users.filter((u) => {
    const roles = u.roles ?? [u.role];
    return roles.includes("student") || u.role === "student" || roles.length === 0;
  });

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (form.mode === "rental") {
        await createRentalBooking(
          session,
          form.hallId,
          fromLocalInput(form.startsAt),
          fromLocalInput(form.endsAt),
        );
        setMessage("Бронь зала создана.");
      } else {
        await createAdminSession(session, {
          title: form.title.trim() || "Занятие",
          hallId: form.hallId,
          startsAt: fromLocalInput(form.startsAt),
          endsAt: fromLocalInput(form.endsAt),
          capacity: form.capacity,
          coachId: form.coachId || coachOnlyId || undefined,
          groupKey: form.groupKey || undefined,
        });
        setMessage("Занятие добавлено в календарь.");
      }
      await reload(session);
    } catch {
      setError("Не удалось создать запись (проверьте конфликт зала и права).");
    } finally {
      setBusy(false);
    }
  }

  async function onCancel(id: string) {
    if (!session || !window.confirm("Отменить занятие?")) return;
    setBusy(true);
    try {
      await cancelAdminSession(session, id);
      if (selectedId === id) setSelectedId(null);
      setMessage("Занятие отменено.");
      await reload(session);
    } catch {
      setError("Не удалось отменить.");
    } finally {
      setBusy(false);
    }
  }

  async function onEnroll() {
    if (!session || !selectedId || !enrollStudentId) return;
    setBusy(true);
    try {
      await enrollStudent(session, selectedId, enrollStudentId);
      setEnrollStudentId("");
      setMessage("Ученик назначен на занятие.");
      await reload(session);
    } catch {
      setError("Не удалось назначить ученика.");
    } finally {
      setBusy(false);
    }
  }

  async function onUnenroll(studentId: string) {
    if (!session || !selectedId) return;
    setBusy(true);
    try {
      await unenrollStudent(session, selectedId, studentId);
      await reload(session);
    } catch {
      setError("Не удалось снять ученика.");
    } finally {
      setBusy(false);
    }
  }

  async function onMark(studentId: string, present: boolean) {
    if (!session || !selectedId) return;
    setBusy(true);
    try {
      const row = await markSessionAttendance(session, selectedId, {
        studentId,
        present,
        resultNotes: resultNotes[studentId] ?? "",
      });
      setAttendance((prev) => {
        const rest = prev.filter((a) => a.studentId !== studentId);
        return [...rest, row];
      });
      setMessage(present ? "Посещение отмечено." : "Отсутствие отмечено.");
    } catch {
      setError("Не удалось сохранить посещаемость (нужны права тренера/админа).");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      {error && <p className="text-sm text-[#c45c2a]">{error}</p>}
      {message && <p className="text-sm text-mos-amber">{message}</p>}

      {allowCreate && (
        <section className="border border-mos-line/40 bg-mos-stone/20 p-5">
          <h2 className="font-display text-xl text-mos-amber">
            {allowRental ? "Добавить занятие / бронь зала" : "Добавить занятие"}
          </h2>
          <form onSubmit={(e) => void submitCreate(e)} className="mt-4 grid gap-3 md:grid-cols-2">
            {allowRental && (
              <label className="block text-xs uppercase tracking-widest text-mos-muted md:col-span-2">
                Тип
                <select
                  className="mt-1 w-full border border-mos-line bg-mos-bg px-3 py-2 text-mos-text"
                  value={form.mode}
                  onChange={(e) => setForm((f) => ({ ...f, mode: e.target.value as "session" | "rental" }))}
                >
                  <option value="session">Занятие</option>
                  <option value="rental">Бронь зала</option>
                </select>
              </label>
            )}
            {form.mode === "session" && (
              <label className="block text-xs uppercase tracking-widest text-mos-muted">
                Название
                <input
                  className="mt-1 w-full border border-mos-line bg-mos-bg px-3 py-2 text-mos-text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Групповая тренировка"
                  required
                />
              </label>
            )}
            <label className="block text-xs uppercase tracking-widest text-mos-muted">
              Зал
              <select
                className="mt-1 w-full border border-mos-line bg-mos-bg px-3 py-2 text-mos-text"
                value={form.hallId}
                onChange={(e) => setForm((f) => ({ ...f, hallId: e.target.value }))}
              >
                {halls.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </label>
            {form.mode === "session" && !coachOnlyId && (
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
            )}
            {form.mode === "session" && (
              <label className="block text-xs uppercase tracking-widest text-mos-muted">
                Группа
                <select
                  className="mt-1 w-full border border-mos-line bg-mos-bg px-3 py-2 text-mos-text"
                  value={form.groupKey}
                  onChange={(e) => setForm((f) => ({ ...f, groupKey: e.target.value }))}
                >
                  <option value="">Без группы</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="block text-xs uppercase tracking-widest text-mos-muted">
              Начало
              <input
                type="datetime-local"
                className="mt-1 w-full border border-mos-line bg-mos-bg px-3 py-2 text-mos-text"
                value={form.startsAt}
                onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
                required
              />
            </label>
            <label className="block text-xs uppercase tracking-widest text-mos-muted">
              Конец
              <input
                type="datetime-local"
                className="mt-1 w-full border border-mos-line bg-mos-bg px-3 py-2 text-mos-text"
                value={form.endsAt}
                onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
                required
              />
            </label>
            {form.mode === "session" && (
              <label className="block text-xs uppercase tracking-widest text-mos-muted">
                Вместимость
                <input
                  type="number"
                  min={1}
                  className="mt-1 w-full border border-mos-line bg-mos-bg px-3 py-2 text-mos-text"
                  value={form.capacity}
                  onChange={(e) => setForm((f) => ({ ...f, capacity: Number(e.target.value) || 1 }))}
                />
              </label>
            )}
            <div className="md:col-span-2">
              <button type="submit" className="mos-btn" disabled={busy}>
                {form.mode === "rental" ? "Забронировать зал" : "Добавить занятие"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="overflow-x-auto border border-mos-line/40">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-mos-line/40 text-xs uppercase tracking-widest text-mos-muted">
              <tr>
                <th className="px-3 py-2">Время</th>
                <th className="px-3 py-2">Занятие</th>
                <th className="px-3 py-2">Зал</th>
                <th className="px-3 py-2">Состав</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr
                  key={s.id}
                  className={`cursor-pointer border-b border-mos-line/20 ${selectedId === s.id ? "bg-mos-amber/10" : "hover:bg-mos-stone/30"}`}
                  onClick={() => setSelectedId(s.id)}
                >
                  <td className="px-3 py-2 text-mos-muted">{formatRange(s.startsAt, s.endsAt)}</td>
                  <td className="px-3 py-2 text-mos-text">{s.title}</td>
                  <td className="px-3 py-2 text-mos-muted">{hallName(s.hallId)}</td>
                  <td className="px-3 py-2 text-mos-muted">
                    {s.enrolled}/{s.capacity}
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-mos-muted">
                    Занятий пока нет — добавьте первое.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border border-mos-line/40 bg-mos-stone/10 p-4">
          {!selected ? (
            <p className="text-sm text-mos-muted">Выберите занятие, чтобы назначить учеников и отметить посещение.</p>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="font-display text-lg text-mos-amber">{selected.title}</h3>
                <p className="text-xs text-mos-muted">
                  {formatRange(selected.startsAt, selected.endsAt)} · {hallName(selected.hallId)}
                </p>
              </div>

              {!coachOnlyId && (
                <button
                  type="button"
                  className="border border-[#c45c2a]/40 px-3 py-1 text-xs text-[#c45c2a]"
                  disabled={busy}
                  onClick={() => void onCancel(selected.id)}
                >
                  Отменить занятие
                </button>
              )}

              <div>
                <p className="text-xs uppercase tracking-widest text-mos-muted">Ученики на занятии</p>
                <ul className="mt-2 space-y-2">
                  {(selected.studentIds ?? []).map((sid) => {
                    const stu = users.find((u) => u.id === sid);
                    const mark = attendance.find((a) => a.studentId === sid);
                    return (
                      <li key={sid} className="border border-mos-line/30 p-2 text-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span>{stu?.displayName ?? sid}</span>
                          <div className="flex flex-wrap gap-1">
                            <button
                              type="button"
                              className="mos-btn px-2 py-1 text-[10px]"
                              disabled={busy}
                              onClick={() => void onMark(sid, true)}
                            >
                              Был
                            </button>
                            <button
                              type="button"
                              className="border border-mos-line/40 px-2 py-1 text-[10px] text-mos-muted"
                              disabled={busy}
                              onClick={() => void onMark(sid, false)}
                            >
                              Не был
                            </button>
                            {!coachOnlyId && (
                              <button
                                type="button"
                                className="border border-[#c45c2a]/40 px-2 py-1 text-[10px] text-[#c45c2a]"
                                disabled={busy}
                                onClick={() => void onUnenroll(sid)}
                              >
                                Снять
                              </button>
                            )}
                          </div>
                        </div>
                        <input
                          className="mt-2 w-full border border-mos-line bg-mos-bg px-2 py-1 text-xs text-mos-text"
                          placeholder="Результат / заметка тренера"
                          value={resultNotes[sid] ?? mark?.resultNotes ?? ""}
                          onChange={(e) => setResultNotes((m) => ({ ...m, [sid]: e.target.value }))}
                        />
                        {mark && (
                          <p className="mt-1 text-[10px] text-mos-muted">
                            {mark.present ? "Присутствие" : "Отсутствие"} ·{" "}
                            {new Date(mark.markedAt).toLocaleString("ru-RU")}
                          </p>
                        )}
                      </li>
                    );
                  })}
                  {(selected.studentIds ?? []).length === 0 && (
                    <li className="text-xs text-mos-muted">Пока никого нет</li>
                  )}
                </ul>
              </div>

              {!coachOnlyId && (
                <div className="flex flex-wrap gap-2">
                  <select
                    className="min-w-[12rem] flex-1 border border-mos-line bg-mos-bg px-2 py-2 text-sm text-mos-text"
                    value={enrollStudentId}
                    onChange={(e) => setEnrollStudentId(e.target.value)}
                  >
                    <option value="">Выбрать ученика</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.displayName}
                      </option>
                    ))}
                  </select>
                  <button type="button" className="mos-btn" disabled={busy || !enrollStudentId} onClick={() => void onEnroll()}>
                    Назначить
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl text-mos-amber">Занятость залов</h2>
        <p className="mt-1 text-sm text-mos-muted">Кто занимает зал и в какое время.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {halls.map((hall) => {
            const rows = sessions.filter((s) => s.hallId === hall.id);
            return (
              <div key={hall.id} className="border border-mos-line/40 p-4">
                <h3 className="font-display text-mos-text">{hall.name}</h3>
                <ul className="mt-3 space-y-2 text-sm">
                  {rows.map((s) => (
                    <li key={s.id} className="text-mos-muted">
                      <span className="text-mos-text">{s.title}</span>
                      <br />
                      {formatRange(s.startsAt, s.endsAt)}
                      {s.coachId ? ` · тренер ${users.find((u) => u.id === s.coachId)?.displayName ?? s.coachId}` : ""}
                    </li>
                  ))}
                  {rows.length === 0 && <li className="text-mos-muted">Свободен в ближайшем расписании</li>}
                </ul>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
