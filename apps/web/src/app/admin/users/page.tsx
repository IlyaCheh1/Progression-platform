"use client";

import { useCallback, useEffect, useState } from "react";
import { SCHOOL_API } from "@/lib/utils";
import { ASSIGNABLE_ROLES, ROLE_LABELS, formatRoles, normalizeRole, normalizeRoles, type UserRole } from "@/lib/rbac";
import { authHeaders, loadSession, type SessionUser } from "@/lib/session";

type UserRow = {
  id: string;
  displayName: string;
  login: string;
  role: string;
  roles?: string[];
  characterId: string;
};

const EMPTY_FORM = {
  displayName: "",
  login: "",
  password: "",
  role: "student" as UserRole,
};

export default function AdminUsersPage() {
  const [session, setSession] = useState<SessionUser | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async (user: SessionUser) => {
    setError("");
    const res = await fetch(`${SCHOOL_API}/v1/admin/students`, { headers: authHeaders(user) });
    if (!res.ok) {
      setError("Не удалось загрузить пользователей.");
      return;
    }
    const data = (await res.json()) as UserRow[];
    data.sort((a, b) => (a.displayName || "").localeCompare(b.displayName || "", "ru"));
    setUsers(data);
  }, []);

  useEffect(() => {
    const s = loadSession();
    if (!s) return;
    setSession(s);
    void reload(s);
  }, [reload]);

  async function submitUser(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const payload = {
        displayName: form.displayName.trim(),
        login: form.login.trim(),
        password: form.password,
        role: form.role,
      };
      const res = await fetch(
        editId ? `${SCHOOL_API}/v1/admin/users/${editId}` : `${SCHOOL_API}/v1/admin/users`,
        {
          method: editId ? "PUT" : "POST",
          headers: authHeaders(session),
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) {
        setError(editId ? "Не удалось обновить пользователя." : "Не удалось создать пользователя.");
        return;
      }
      setMessage(editId ? "Пользователь обновлён." : "Пользователь создан.");
      setForm(EMPTY_FORM);
      setEditId(null);
      await reload(session);
    } catch {
      setError("API недоступен.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteUser(id: string) {
    if (!session || !window.confirm("Удалить пользователя?")) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`${SCHOOL_API}/v1/admin/users/${id}`, {
        method: "DELETE",
        headers: authHeaders(session),
      });
      if (!res.ok) {
        setError("Не удалось удалить пользователя.");
        return;
      }
      setMessage("Пользователь удалён.");
      if (editId === id) {
        setEditId(null);
        setForm(EMPTY_FORM);
      }
      await reload(session);
    } catch {
      setError("API недоступен.");
    } finally {
      setBusy(false);
    }
  }

  function startEdit(user: UserRow) {
    setEditId(user.id);
    setForm({
      displayName: user.displayName,
      login: user.login,
      password: "",
      role: (user.role as UserRole) || "student",
    });
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl text-mos-text">Пользователи</h1>
      <p className="mt-2 text-sm text-mos-muted">
        Создание, редактирование и удаление учётных записей. Доступно роли администратора.
      </p>
      {error && <p className="mt-4 text-sm text-[#c45c2a]">{error}</p>}
      {message && <p className="mt-4 text-sm text-mos-amber">{message}</p>}

      <section className="mt-8 border border-mos-line/40 bg-mos-stone/20 p-5">
        <h2 className="font-display text-xl text-mos-amber">{editId ? "Редактирование" : "Новый пользователь"}</h2>
        <form onSubmit={submitUser} className="mt-4 grid gap-3 md:grid-cols-2">
          <Field label="Имя" value={form.displayName} onChange={(v) => setForm((f) => ({ ...f, displayName: v }))} required />
          <Field label="Логин" value={form.login} onChange={(v) => setForm((f) => ({ ...f, login: v }))} required />
          <Field
            label={editId ? "Новый пароль (опционально)" : "Пароль"}
            value={form.password}
            onChange={(v) => setForm((f) => ({ ...f, password: v }))}
            required={!editId}
            type="password"
          />
          <label className="block text-xs uppercase tracking-widest text-mos-muted">
            Роль
            <select
              className="mt-1 w-full border border-mos-line bg-mos-bg px-3 py-2 text-mos-text"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
            >
              {ASSIGNABLE_ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </label>
          <div className="md:col-span-2 flex flex-wrap gap-2">
            <button type="submit" className="mos-btn" disabled={busy}>
              {editId ? "Сохранить" : "Создать"}
            </button>
            {editId && (
              <button
                type="button"
                className="border border-mos-line/40 px-4 py-2 text-xs uppercase tracking-widest text-mos-muted"
                onClick={() => {
                  setEditId(null);
                  setForm(EMPTY_FORM);
                }}
              >
                Отмена
              </button>
            )}
          </div>
        </form>
      </section>

      <div className="mt-8 overflow-x-auto border border-mos-line/40">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-mos-line/40 text-xs uppercase tracking-widest text-mos-muted">
            <tr>
              <th className="px-3 py-2">Имя</th>
              <th className="px-3 py-2">Логин</th>
              <th className="px-3 py-2">Роль</th>
              <th className="px-3 py-2">Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-mos-line/20 text-mos-text">
                <td className="px-3 py-2">{user.displayName}</td>
                <td className="px-3 py-2 text-mos-muted">{user.login}</td>
                <td className="px-3 py-2 text-mos-muted">
                  {formatRoles(normalizeRoles(user.roles ?? user.role) as UserRole[])}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="mos-btn px-2 py-1 text-xs" onClick={() => startEdit(user)}>
                      Изменить
                    </button>
                    <button
                      type="button"
                      className="border border-[#c45c2a]/40 px-2 py-1 text-xs text-[#c45c2a]"
                      disabled={busy || user.id === session?.studentId}
                      onClick={() => void deleteUser(user.id)}
                    >
                      Удалить
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block text-xs uppercase tracking-widest text-mos-muted">
      {label}
      <input
        className="mt-1 w-full border border-mos-line bg-mos-bg px-3 py-2 text-mos-text"
        value={value}
        type={type}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </label>
  );
}
