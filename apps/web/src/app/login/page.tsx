"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SCHOOL_API, schoolApiUnavailableMessage } from "@/lib/utils";
import { resolveActiveCabinetRole, userRoleToCabinetRole, writeStoredActiveRole } from "@/lib/cabinets";
import { hasProfile, homePathForRoles, normalizeRole, normalizeRoles, primaryRole, saveSession } from "@/lib/session";
import AppLogo from "@/components/app-logo";
import Link from "next/link";

function readLoginRoles(data: Record<string, unknown>): ReturnType<typeof normalizeRoles> {
  const student = (data.student ?? {}) as Record<string, unknown>;
  return normalizeRoles(data.roles ?? student.roles ?? data.role ?? student.role ?? student.Role);
}

function PasswordToggleIcon({ visible }: { visible: boolean }) {
  if (visible) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.75">
        <path
          d="M3 3l18 18M10.58 10.58A2 2 0 0012 14a2 2 0 001.41-3.41M9.88 4.24A10.94 10.94 0 0112 5c5 0 9.27 3.11 11 7-1.02 2.28-2.78 4.18-5 5.32M6.11 6.11C3.6 7.62 1.73 10.05 1 13c1.73 3.89 6 7 11 7 1.05 0 2.06-.14 3-.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`${SCHOOL_API}/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });
      if (!res.ok) {
        setError("Неверный логин или пароль. Запустите school-api и seed.");
        return;
      }
      const data = await res.json();
      const roles = readLoginRoles(data as Record<string, unknown>);
      const role = primaryRole(roles);
      const session = {
        studentId: data.student.id,
        name: data.student.displayName ?? data.student.DisplayName,
        login,
        characterId: data.student.characterId ?? data.student.CharacterID,
        accessToken: data.accessToken,
        role,
        roles,
      };
      saveSession(session);
      const cabinetRole = resolveActiveCabinetRole(roles, userRoleToCabinetRole(role));
      if (cabinetRole) writeStoredActiveRole(cabinetRole);
      router.push(homePathForRoles(roles, hasProfile()));
    } catch {
      setError(schoolApiUnavailableMessage());
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-4 text-center">
      <Link href="/" className="mb-8 inline-flex shrink-0 justify-center" aria-label="Мастер меча — главная">
        <AppLogo size={78} priority />
      </Link>
      <h1 className="font-display text-3xl text-mos-text">Вход</h1>
      <form onSubmit={onSubmit} className="mt-6 w-full space-y-4 text-left">
        <label className="block text-xs uppercase tracking-widest text-mos-muted">
          Логин
          <input
            className="mt-1 w-full border border-mos-line bg-mos-stone px-3 py-2 text-mos-text"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            autoComplete="username"
          />
        </label>
        <label className="block text-xs uppercase tracking-widest text-mos-muted">
          Пароль
          <div className="relative mt-1">
            <input
              type={showPassword ? "text" : "password"}
              className="w-full border border-mos-line bg-mos-stone px-3 py-2 pr-10 text-mos-text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-mos-muted transition-colors hover:text-mos-amber"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
              aria-pressed={showPassword}
            >
              <PasswordToggleIcon visible={showPassword} />
            </button>
          </div>
        </label>
        {error && <p className="text-sm text-[#c45c2a]">{error}</p>}
        <button type="submit" className="mos-btn w-full">
          Войти
        </button>
      </form>
    </main>
  );
}
