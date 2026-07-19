"use client";

import { useCallback, useEffect, useState } from "react";
import { SCHOOL_API } from "@/lib/utils";
import { formatRoles, normalizeRoles, type UserRole } from "@/lib/rbac";
import { authHeaders, hasPermission, isAdminPrincipal, loadSession, type SessionUser } from "@/lib/session";

type StudentRow = {
  id: string;
  displayName: string;
  login: string;
  role: string;
  roles?: string[];
  characterId: string;
};

export default function AdminSchoolPage() {
  const [session, setSession] = useState<SessionUser | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState("");

  const reload = useCallback(async (user: SessionUser) => {
    setError("");
    const res = await fetch(`${SCHOOL_API}/v1/admin/students`, {
      headers: authHeaders(user),
    });
    if (!res.ok) {
      setError("Не удалось загрузить учеников (нужны права users.read).");
      return;
    }
    const data = (await res.json()) as StudentRow[];
    data.sort((a, b) => (a.displayName || "").localeCompare(b.displayName || "", "ru"));
    setStudents(data);
  }, []);

  useEffect(() => {
    const s = loadSession();
    if (!s) return;
    setSession(s);
    void reload(s);
  }, [reload]);

  async function confirmAttendance(studentId: string) {
    if (!session) return;
    setBusyId(studentId);
    setMessage("");
    setError("");
    try {
      const res = await fetch(`${SCHOOL_API}/v1/attendance/confirm`, {
        method: "POST",
        headers: authHeaders(session),
        body: JSON.stringify({
          studentId,
          attendanceId: `admin-${studentId}-${Date.now()}`,
          xp: 500,
        }),
      });
      if (!res.ok) {
        setError("Не удалось подтвердить посещаемость.");
        return;
      }
      const data = await res.json();
      setMessage(`XP начислен: level=${data.level}, granted=${String(data.granted)}`);
    } catch {
      setError("API недоступен.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl text-mos-text">Админка школы</h1>
      <p className="mt-2 text-sm text-mos-muted">Ученики из локального seed. Пароли в ответе API скрыты.</p>
      {error && <p className="mt-4 text-sm text-[#c45c2a]">{error}</p>}
      {message && <p className="mt-4 text-sm text-mos-amber">{message}</p>}
      <div className="mt-6 overflow-x-auto border border-mos-line/40">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-mos-line/40 text-xs uppercase tracking-widest text-mos-muted">
            <tr>
              <th className="px-3 py-2">Имя</th>
              <th className="px-3 py-2">Логин</th>
              <th className="px-3 py-2">Роль</th>
              <th className="px-3 py-2">Действие</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="border-b border-mos-line/20 text-mos-text">
                <td className="px-3 py-2">{s.displayName}</td>
                <td className="px-3 py-2 text-mos-muted">{s.login}</td>
                <td className="px-3 py-2 text-mos-muted">
                  {formatRoles(normalizeRoles(s.roles ?? s.role) as UserRole[])}
                </td>
                <td className="px-3 py-2">
                  {session && hasPermission(session, "attendance.confirm") && !isAdminPrincipal(normalizeRoles(s.roles ?? s.role)) ? (
                    <button
                      type="button"
                      className="mos-btn px-2 py-1 text-xs"
                      disabled={busyId === s.id}
                      onClick={() => void confirmAttendance(s.id)}
                    >
                      {busyId === s.id ? "…" : "Attendance +500 XP"}
                    </button>
                  ) : (
                    <span className="text-xs text-mos-muted">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
