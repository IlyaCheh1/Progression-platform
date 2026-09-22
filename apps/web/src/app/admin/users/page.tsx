"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ASSIGNABLE_ROLES,
  ROLE_LABELS,
  formatRoles,
  normalizeRoles,
  type UserRole,
} from "@/lib/rbac";
import { authHeaders, loadSession, type SessionUser } from "@/lib/session";
import { SCHOOL_API } from "@/lib/utils";

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
  roles: ["student"] as UserRole[],
};

export default function AdminUsersPage() {
  const [session, setSession] = useState<SessionUser | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [linkForm, setLinkForm] = useState({ displayName: "", login: "" });
  const [issuedLink, setIssuedLink] = useState<{ url: string; mailed: false; displayName: string; login: string } | null>(
    null,
  );
  const [linkError, setLinkError] = useState("");
  const [linkBusy, setLinkBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const formSectionRef = useRef<HTMLElement | null>(null);

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
        role: form.roles[0] ?? "student",
        roles: form.roles,
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
    const roles = normalizeRoles(user.roles ?? user.role).filter((role) =>
      ASSIGNABLE_ROLES.includes(role),
    ) as UserRole[];
    setEditId(user.id);
    setForm({
      displayName: user.displayName,
      login: user.login,
      password: "",
      roles: roles.length > 0 ? roles : ["student"],
    });
    setError("");
    setMessage("");
    window.requestAnimationFrame(() => {
      formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  async function issueLink(draft: { displayName: string; login: string }) {
    if (!session) return;
    setLinkBusy(true);
    setLinkError("");
    setCopied(false);
    setIssuedLink(null);
    try {
      const res = await fetch("/api/admin/registration-links", {
        method: "POST",
        headers: authHeaders(session),
        body: JSON.stringify(draft),
      });
      if (res.status === 403) {
        setLinkError("Недостаточно прав, чтобы создать ссылку.");
        return;
      }
      if (!res.ok) {
        setLinkError(res.status === 400 ? "Укажите имя и логин." : "API недоступен.");
        return;
      }
      const data = (await res.json()) as { url: string; mailed: false; displayName: string; login: string };
      setIssuedLink(data);
    } catch {
      setLinkError("API недоступен.");
    } finally {
      setLinkBusy(false);
    }
  }

  async function copyIssuedLink() {
    if (!issuedLink) return;
    try {
      await navigator.clipboard.writeText(issuedLink.url);
      setCopied(true);
    } catch {
      setCopied(false);
      setLinkError("Не удалось скопировать. Выделите ссылку вручную.");
    }
  }

  function toggleRole(role: UserRole) {
    setForm((f) => {
      const has = f.roles.includes(role);
      if (has && f.roles.length === 1) return f;
      return {
        ...f,
        roles: has ? f.roles.filter((r) => r !== role) : [...f.roles, role],
      };
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

      <section ref={formSectionRef} className="mt-8 border border-mos-line/40 bg-mos-stone/20 p-5">
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
          <div className="md:col-span-2">
            <p className="text-xs uppercase tracking-widest text-mos-muted">Роли</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {ASSIGNABLE_ROLES.map((role) => {
                const on = form.roles.includes(role);
                return (
                  <button
                    key={role}
                    type="button"
                    className={`border px-3 py-2 text-xs ${on ? "border-mos-amber text-mos-amber" : "border-mos-line/40 text-mos-muted"}`}
                    onClick={() => toggleRole(role)}
                  >
                    {ROLE_LABELS[role]}
                  </button>
                );
              })}
            </div>
          </div>
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

      <section className="mt-8 border border-mos-line/40 bg-mos-stone/20 p-5">
        <h2 className="font-display text-xl text-mos-amber">Ссылка на регистрацию</h2>
        <p className="mt-2 text-sm text-mos-muted">
          Ссылка открывает отдельную страницу регистрации через OnlyID. Почта не подключена — скопируйте ссылку и
          отправьте её сами. Ссылка одноразовая и хранится в памяти сервера до перезапуска.
        </p>
        <form
          className="mt-4 grid gap-3 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            void issueLink({ displayName: linkForm.displayName.trim(), login: linkForm.login.trim() });
          }}
        >
          <Field
            label="Имя"
            value={linkForm.displayName}
            onChange={(v) => setLinkForm((f) => ({ ...f, displayName: v }))}
            required
          />
          <Field
            label="Логин"
            value={linkForm.login}
            onChange={(v) => setLinkForm((f) => ({ ...f, login: v }))}
            required
          />
          <div className="md:col-span-2">
            <button type="submit" className="mos-btn" disabled={linkBusy || !session}>
              Создать ссылку
            </button>
          </div>
        </form>
        {linkError && <p className="mt-4 text-sm text-[#c45c2a]">{linkError}</p>}
        {issuedLink && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-mos-amber">Почта не подключена. Скопируйте ссылку и отправьте её сами.</p>
            <p className="break-all text-sm text-mos-text">{issuedLink.url}</p>
            <button type="button" className="mos-btn" onClick={() => void copyIssuedLink()}>
              {copied ? "Скопировано" : "Копировать"}
            </button>
          </div>
        )}
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
                      className="border border-mos-line/40 px-2 py-1 text-xs text-mos-muted"
                      disabled={linkBusy}
                      onClick={() => {
                        setLinkForm({ displayName: user.displayName, login: user.login });
                        void issueLink({ displayName: user.displayName, login: user.login });
                      }}
                    >
                      Ссылка
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
