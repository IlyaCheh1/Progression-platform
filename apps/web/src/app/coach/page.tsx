"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RoleSwitch } from "@/components/role-switch";
import { SCHOOL_API } from "@/lib/utils";
import { authHeaders, hasRole, loadSession, type SessionUser } from "@/lib/session";

type StudentRow = {
  id: string;
  displayName: string;
  login: string;
  role: string;
};

export default function CoachCabinetPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionUser | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const reload = useCallback(async (user: SessionUser) => {
    const res = await fetch(`${SCHOOL_API}/v1/students`, { headers: authHeaders(user) });
    if (!res.ok) {
      setError("Не удалось загрузить список учеников.");
      return;
    }
    const data = (await res.json()) as StudentRow[];
    setStudents(data.filter((s) => s.role === "student" || !s.role));
  }, []);

  useEffect(() => {
    const s = loadSession();
    if (!s) {
      router.replace("/login");
      return;
    }
    if (!hasRole(s.roles, "coach")) {
      router.replace("/profile");
      return;
    }
    setSession(s);
    void reload(s);
  }, [router, reload]);

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
          attendanceId: `coach-${studentId}-${Date.now()}`,
          xp: 500,
        }),
      });
      if (!res.ok) {
        setError("Не удалось подтвердить посещение.");
        return;
      }
      const data = await res.json();
      setMessage(`Посещение подтверждено: level=${data.level}`);
    } catch {
      setError("API недоступен.");
    } finally {
      setBusyId("");
    }
  }

  if (!session) {
    return <main className="grid min-h-screen place-items-center text-mos-muted">Проверка доступа…</main>;
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-16">
      <p className="font-display tracking-[0.18em] text-mos-amber">COACH</p>
      <h1 className="mt-2 font-display text-3xl text-mos-text">Кабинет тренера</h1>
      <p className="mt-4 text-sm text-mos-muted">Подтверждение посещаемости и работа с группой.</p>
      <RoleSwitch user={session} className="mt-6" />
      {error && <p className="mt-4 text-sm text-[#c45c2a]">{error}</p>}
      {message && <p className="mt-4 text-sm text-mos-amber">{message}</p>}

      <div className="mt-8 overflow-x-auto border border-mos-line/40">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-mos-line/40 text-xs uppercase tracking-widest text-mos-muted">
            <tr>
              <th className="px-3 py-2">Ученик</th>
              <th className="px-3 py-2">Логин</th>
              <th className="px-3 py-2">Действие</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="border-b border-mos-line/20">
                <td className="px-3 py-2">{s.displayName}</td>
                <td className="px-3 py-2 text-mos-muted">{s.login}</td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    className="mos-btn px-2 py-1 text-xs"
                    disabled={busyId === s.id}
                    onClick={() => void confirmAttendance(s.id)}
                  >
                    {busyId === s.id ? "…" : "Подтвердить посещение"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Link href="/profile" className="mos-btn mt-8 inline-flex">
        К профилю
      </Link>
    </main>
  );
}
